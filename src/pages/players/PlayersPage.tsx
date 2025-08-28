// src/pages/players/PlayersPage.tsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useOrg } from "@/context/OrgContext";
import { usePlayerLeaderboard, useTeamStats } from "@/lib/data/hooks";
import { Search, Filter, AlertTriangle } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

/* -------------------------------- Types ------------------------------- */
type PlayerRow = {
  name: string;
  total: number;
  batting: number;
  bowling: number;
  fielding: number;
  penalty: number;
};

type TeamStatsUI = {
  runs: number; fifties: number; hundreds: number; fours: number; sixes: number;
  wickets: number; fiveFors: number; maidens: number; catches: number;
  runouts: number; assists: number; stumpings: number; ducks: number; drops: number;
};

/* --------------------------- Demo fallbacks --------------------------- */
const DEMO_PLAYERS: PlayerRow[] = [
  { name: "Danny Finch", total: 1974, batting: 1371, bowling: 480, fielding: 100, penalty: -13 },
  { name: "Saf Abbas", total: 1470, batting: 659,  bowling: 760, fielding: 50,  penalty: -35 },
  { name: "Alfie Hedges", total: 1416, batting: 853,  bowling: 465, fielding: 120, penalty: -55 },
  { name: "Rob Harvey", total: 1189, batting: 1048, bowling: 135, fielding: 30,  penalty: -45 },
  { name: "Ryan Chapman", total: 1090, batting: 925,  bowling: 75,  fielding: 130, penalty: -55 },
  { name: "Armaan AliShah", total: 993,  batting: 697,  bowling: 280, fielding: 20,  penalty: -25 },
  { name: "Hasnain Iqbal", total: 919,  batting: 74,   bowling: 800, fielding: 40,  penalty: -25 },
  { name: "Justin Godfrae", total: 824,  batting: 178,  bowling: 600, fielding: 80,  penalty: -70 },
  { name: "Jason Biggs", total: 789,  batting: 770,  bowling: 0,   fielding: 50,  penalty: -40 },
  { name: "John-Paul Heppell", total: 711, batting: 155,  bowling: 470, fielding: 80,  penalty: -30 },
];

const DEMO_TEAM: TeamStatsUI = {
  runs: 5864, fifties: 26, hundreds: 11, fours: 812, sixes: 75,
  wickets: 244, fiveFors: 5, maidens: 138, catches: 121,
  runouts: 3, assists: 8, stumpings: 10, ducks: 26, drops: 63,
};

/* ----------------------------- Utilities ----------------------------- */
const brand = (step: string) => `rgb(var(--brand-${step}))`;
const fmt = (n: number) => new Intl.NumberFormat().format(n);

function StatChip({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-brand-100 bg-card px-3 py-2">
      <div className="text-[11px] text-text-soft">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card rounded-2xl shadow-md border border-brand-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-brand-100"><h2 className="font-semibold">{title}</h2></div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function LoadingRow() {
  return <div className="h-4 w-full rounded bg-brand-100/50 animate-pulse" />;
}

/* -------------------------------- Page -------------------------------- */
export default function PlayersPage() {
  const { clubId, seasonId } = useOrg();

  // Live data
  const { data: livePlayers, loading: loadingPlayers, error: errPlayers } = usePlayerLeaderboard(clubId, seasonId);
  const { data: liveTeam,    loading: loadingTeam,    error: errTeam }    = useTeamStats(clubId, seasonId);

  // Merge live → fallback
  const rows: PlayerRow[] = useMemo(() => {
    if (livePlayers && livePlayers.length) {
      return livePlayers.map(p => ({
        name: p.name,
        total: p.total,
        batting: p.batting,
        bowling: p.bowling,
        fielding: p.fielding,
        penalty: p.penalty,
      }));
    }
    return DEMO_PLAYERS;
  }, [livePlayers]);

  const team: TeamStatsUI = useMemo(() => {
    if (liveTeam) {
      return {
        runs: liveTeam.runs, fifties: liveTeam.fifties, hundreds: liveTeam.hundreds,
        fours: liveTeam.fours, sixes: liveTeam.sixes,
        wickets: liveTeam.wickets, fiveFors: liveTeam.fiveFors, maidens: liveTeam.maidens,
        catches: liveTeam.catches, runouts: liveTeam.runouts, assists: liveTeam.assists,
        stumpings: liveTeam.stumpings, ducks: liveTeam.ducks, drops: liveTeam.drops,
      };
    }
    return DEMO_TEAM;
  }, [liveTeam]);

  // Search + sort
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<keyof PlayerRow>("total");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    const base = rows.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
    const dir = sortDir === "asc" ? 1 : -1;
    return [...base].sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name) * dir;
      const av = a[sortKey] as number;
      const bv = b[sortKey] as number;
      return (av - bv) * dir;
    });
  }, [q, sortKey, sortDir, rows]);

  // Charts
  const topBat = useMemo(
    () => rows.map(p => ({ name: p.name, value: p.batting }))
              .sort((a, b) => b.value - a.value)
              .slice(0, 10),
    [rows]
  );

  const topBowl = useMemo(
    () => rows.map(p => ({ name: p.name, value: p.bowling }))
              .sort((a, b) => b.value - a.value)
              .slice(0, 10),
    [rows]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Players</h1>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-2 top-2.5 text-text-soft" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search players"
              className="pl-8 pr-3 py-2 rounded-xl border border-brand-100 bg-card focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>
          <button className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-brand-200 bg-card hover:bg-brand-50">
            <Filter size={16} /> Filters
          </button>
        </div>
      </div>

      {/* Errors (if any) */}
      {(errPlayers || errTeam) && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
          <AlertTriangle size={16} />
          {errPlayers ?? errTeam}
        </div>
      )}

      {/* Team stats */}
      <Section title="Team Stats">
        {loadingTeam && !liveTeam ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => <LoadingRow key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatChip label="Runs" value={team.runs} />
            <StatChip label="50's" value={team.fifties} />
            <StatChip label="100's" value={team.hundreds} />
            <StatChip label="4's" value={team.fours} />
            <StatChip label="6's" value={team.sixes} />
            <StatChip label="Wickets" value={team.wickets} />
            <StatChip label="5-fors" value={team.fiveFors} />
            <StatChip label="Maidens" value={team.maidens} />
            <StatChip label="Catches" value={team.catches} />
            <StatChip label="Run-outs" value={team.runouts} />
            <StatChip label="Stumpings" value={team.stumpings} />
            <StatChip label="Ducks" value={team.ducks} />
            <StatChip label="Drops" value={team.drops} />
          </div>
        )}
      </Section>

      {/* Leaderboard */}
      <Section title="Brookweald MVP">
        <div className="overflow-auto">
          {loadingPlayers && !livePlayers ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <LoadingRow key={i} />)}
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-text-soft border-b border-brand-100">
                  {([
                    ["name","Player"],
                    ["total","Total Points"],
                    ["batting","Batting Points"],
                    ["bowling","Bowling Points"],
                    ["fielding","Fielding Points"],
                    ["penalty","Penalty Points"],
                  ] as [keyof PlayerRow, string][]).map(([k,label]) => (
                    <th key={k} className="py-2 pr-4">
                      <button
                        className={`inline-flex items-center gap-1 ${sortKey===k?"text-text-strong":""}`}
                        onClick={() => {
                          if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
                          else { setSortKey(k); setSortDir(k === "name" ? "asc" : "desc"); }
                        }}
                      >
                        {label}
                        {sortKey===k && <span className="text-[10px]">{sortDir==="asc"?"▲":"▼"}</span>}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.name} className="border-b border-brand-100/60">
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {i + 1}.{" "}
                      <Link
                        to={`/players/${encodeURIComponent(p.name)}`}
                        className="underline decoration-brand-300/70 underline-offset-2 hover:decoration-brand-600"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 font-semibold">{fmt(p.total)}</td>
                    <td className="py-2 pr-4">{fmt(p.batting)}</td>
                    <td className="py-2 pr-4">{fmt(p.bowling)}</td>
                    <td className="py-2 pr-4">{fmt(p.fielding)}</td>
                    <td className="py-2 pr-0 text-red-600">{p.penalty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Section>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Section title="Top Batter Points">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topBat} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={brand("600")} radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
        <Section title="Top Bowler Points">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topBowl} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={brand("400")} radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>
    </div>
  );
}
