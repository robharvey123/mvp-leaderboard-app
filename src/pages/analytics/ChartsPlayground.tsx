// src/pages/analytics/ChartsPlayground.tsx
import { useEffect, useMemo, useState } from "react";
import ChartCard from "@/components/ChartCard";
import SeasonPicker from "@/components/SeasonPicker";
import { scorePerformance, calcBattingPoints, calcBowlingPoints, calcFieldingPoints } from "@/lib/scoring/engine";
import { demoPlayers, type DemoPlayer } from "@/lib/demoStore";
import { demoMatches, type DemoMatch } from "@/lib/demoMatchesStore";
import { demoPerfs, type DemoPerformance } from "@/lib/demoMatchesStore";
import { FEATURES } from "@/config/features";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
} from "recharts";

type Row = { id: string; name: string; runs: number; wickets: number; points: number };

function groupBy<T, K extends string | number>(rows: T[], keyFn: (r: T) => K) {
  const m = new Map<K, T[]>();
  for (const r of rows) {
    const k = keyFn(r);
    const arr = m.get(k) || [];
    arr.push(r);
    m.set(k, arr);
  }
  return m;
}

function fmt(num: number) {
  return num.toLocaleString();
}

export default function ChartsPlayground() {
  const [players, setPlayers] = useState<DemoPlayer[]>([]);
  const [perfs, setPerfs] = useState<DemoPerformance[]>([]);
  const [matches, setMatches] = useState<DemoMatch[]>([]);
  const [season, setSeason] = useState<string>("all"); // "all" or "YYYY"
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Demo data only (we've parked Supabase wiring)
      const [pls, ps, ms] = await Promise.all([
        demoPlayers.list(),
        demoPerfs.list(),
        demoMatches.list(),
      ]);
      setPlayers(pls);
      setPerfs(ps);
      setMatches(ms);
      setLoading(false);
    })();
  }, []);

  // Season filter: compute allowed matchIds for the chosen year
  const seasonMatchIds = useMemo(() => {
    if (season === "all") return new Set(matches.map((m) => m.id));
    return new Set(matches.filter((m) => (m.date || "").startsWith(season)).map((m) => m.id));
  }, [matches, season]);

  const seasonPerfs = useMemo(
    () => perfs.filter((p) => seasonMatchIds.has(p.matchId)),
    [perfs, seasonMatchIds]
  );

  const playerName = (id: string) => players.find((p) => p.id === id)?.name || id;

  const leaderboard: Row[] = useMemo(() => {
    const m = new Map<string, Row>();
    for (const p of seasonPerfs) {
      const id = p.playerId;
      const row = m.get(id) || { id, name: playerName(id), runs: 0, wickets: 0, points: 0 };
      row.runs += p.runs ?? 0;
      row.wickets += p.wickets ?? 0;
      row.points += scorePerformance(p);
      m.set(id, row);
    }
    return Array.from(m.values()).sort((a, b) => b.points - a.points);
  }, [seasonPerfs, players]);

  // Points over time (club total by match date)
  const pointsByDate = useMemo(() => {
    const byMatch = groupBy(seasonPerfs, (p) => p.matchId);
    const mIdx = new Map(matches.map((m) => [m.id, m]));
    const rows = [];
    for (const [mid, list] of byMatch) {
      const date = mIdx.get(mid)?.date || "";
      const total = list.reduce((acc, r) => acc + scorePerformance(r), 0);
      rows.push({ date, total });
    }
    return rows.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  }, [seasonPerfs, matches]);

  // Stacked area: batting vs bowling vs fielding points by date (club totals)
  const compByDate = useMemo(() => {
    const byMatch = groupBy(seasonPerfs, (p) => p.matchId);
    const mIdx = new Map(matches.map((m) => [m.id, m]));
    const rows = [];
    for (const [mid, list] of byMatch) {
      const date = mIdx.get(mid)?.date || "";
      const batting = list.reduce(
        (acc, r) => acc + calcBattingPoints({ runs: r.runs ?? 0, fours: r.fours ?? 0, sixes: r.sixes ?? 0 }),
        0
      );
      const bowling = list.reduce(
        (acc, r) => acc + calcBowlingPoints({ wickets: r.wickets ?? 0, overs: r.overs ?? 0, runs_conceded: r.runs_conceded ?? 0, maidens: r.maidens ?? 0 }),
        0
      );
      const fielding = list.reduce(
        (acc, r) => acc + calcFieldingPoints({ catches: r.catches ?? 0, stumpings: r.stumpings ?? 0, runouts: r.runouts ?? 0 }),
        0
      );
      rows.push({ date, batting, bowling, fielding });
    }
    return rows.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  }, [seasonPerfs, matches]);

  // Top 10 runs / wickets bar charts
  const topRuns = useMemo(
    () => leaderboard.slice().sort((a, b) => b.runs - a.runs).slice(0, 10).map((r) => ({ name: r.name, Runs: r.runs })),
    [leaderboard]
  );
  const topWkts = useMemo(
    () => leaderboard.slice().sort((a, b) => b.wickets - a.wickets).slice(0, 10).map((r) => ({ name: r.name, Wickets: r.wickets })),
    [leaderboard]
  );

  // Histogram of runs per innings (club-wide)
  const runsHist = useMemo(() => {
    const bins = Array.from({ length: 9 }, (_, i) => ({ label: `${i * 10}-${i * 10 + 9}`, count: 0 }));
    bins.push({ label: "90+", count: 0 });
    for (const p of seasonPerfs) {
      const r = p.runs ?? 0;
      const idx = r >= 90 ? 9 : Math.floor(r / 10);
      bins[idx].count++;
    }
    return bins;
  }, [seasonPerfs]);

  // Scatter: points vs runs (each performance)
  const scatter = useMemo(
    () =>
      seasonPerfs.map((p) => ({
        runs: p.runs ?? 0,
        pts: scorePerformance(p),
      })),
    [seasonPerfs]
  );

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-gray-600">Season filter + multi-chart overview powered by the MVP scoring engine.</p>
        </div>
        <SeasonPicker
          dates={matches.map((m) => m.date || "")}
          value={season}
          onChange={setSeason}
        />
      </header>

      {FEATURES.backend !== "demo" && (
        <div className="rounded-md border bg-amber-50 text-amber-800 text-xs p-2">
          You’re on <b>{FEATURES.backend}</b>. These charts currently use <b>demo</b> data until we finalize the Supabase wiring.
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-600">Loading…</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Leaderboard (Top points) */}
          <ChartCard
            title="MVP Leaderboard (Top 10)"
            subtitle={season === "all" ? "All seasons" : `Season ${season}`}
            height={320}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaderboard.slice(0, 10).map(r => ({ name: r.name, Points: r.points }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Points" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Points over time */}
          <ChartCard title="Club points over time" subtitle="Total MVP points per match (date)" height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pointsByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Composition area */}
          <ChartCard title="Points composition" subtitle="Batting vs Bowling vs Fielding (by match date)" height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={compByDate} stackOffset="expand">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v) => `${Math.round(v * 100)}%`} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="batting" stackId="1" />
                <Area type="monotone" dataKey="bowling" stackId="1" />
                <Area type="monotone" dataKey="fielding" stackId="1" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Top runs */}
          <ChartCard title="Runs — Top 10" subtitle="Aggregated by player" height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topRuns}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Runs" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Top wickets */}
          <ChartCard title="Wickets — Top 10" subtitle="Aggregated by player" height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topWkts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Wickets" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Runs distribution */}
          <ChartCard title="Runs distribution" subtitle="Per-innings histogram" height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={runsHist}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Innings" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Scatter: points vs runs */}
          <ChartCard title="Points vs Runs" subtitle="Each dot is a performance" height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="runs" name="Runs" />
                <YAxis dataKey="pts" name="Points" />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Scatter name="perf" data={scatter} />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  );
}
