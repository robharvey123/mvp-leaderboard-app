// src/pages/DemoLeaderboard.tsx
import { useEffect, useMemo, useState } from "react";
import { FEATURES } from "@/config/features";
import { getActiveClubId } from "@/lib/club";
import { demoPerfs, type DemoPerformance, demoMatches, type DemoMatch } from "@/lib/demoMatchesStore";
import { demoPlayers, type DemoPlayer } from "@/lib/demoStore";
import SeasonPicker from "@/components/SeasonPicker";
import { scorePerformance, DEFAULT_WEIGHTS } from "@/lib/scoring/engine";
import { downloadCsv } from "@/lib/export/csv";
import { supabaseMatches } from "@/lib/adapters/supabaseMatches";

// Recharts sparkline
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function formatErr(e: any): string {
  if (!e) return "Unknown error";
  if (typeof e === "string") return e;
  const d = (e as any).error ?? e;
  return d?.message || d?.hint || d?.details || (d?.status && String(d.status)) || JSON.stringify(d);
}

type Row = { playerId: string; name: string; runs: number; wickets: number; points: number };

export default function DemoLeaderboard() {
  const backend = FEATURES.backend;
  const clubId = getActiveClubId() || "—";

  const [players, setPlayers] = useState<DemoPlayer[]>([]);
  const [perfs, setPerfs] = useState<DemoPerformance[]>([]);
  const [matches, setMatches] = useState<DemoMatch[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [season, setSeason] = useState<string>("all"); // "all" or "YYYY"
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setError(null);
      try {
        const [pls, ps] = await Promise.all([demoPlayers.list(), demoPerfs.list()]);
        setPlayers(pls);
        setPerfs(ps);

        // Matches for season filtering
        if (backend === "supabase") {
          const ms = await supabaseMatches.list(); // adapter already normalizes date
          setMatches(ms.map((m) => ({ id: m.id, date: (m.date ?? "") as string, opponent: m.opponent ?? undefined })));
        } else {
          const ms = await demoMatches.list();
          setMatches(ms);
        }
      } catch (e) {
        console.error("load leaderboard failed", e);
        setError(formatErr(e));
      }
    })();
  }, [backend]);

  // Build set of allowed matchIds for current season
  const seasonMatchIds = useMemo<Set<string>>(() => {
    if (season === "all") return new Set(matches.map((m) => m.id));
    return new Set(
      matches
        .filter((m) => (m.date || "").startsWith(season))
        .map((m) => m.id)
    );
  }, [matches, season]);

  // Apply season filter to perfs
  const filteredPerfs = useMemo<DemoPerformance[]>(() => {
    if (season === "all") return perfs;
    return perfs.filter((p) => seasonMatchIds.has(p.matchId));
  }, [perfs, season, seasonMatchIds]);

  const rows = useMemo<Row[]>(() => {
    const m = new Map<string, Row>();
    for (const p of filteredPerfs) {
      const key = p.playerId;
      const r = m.get(key) || {
        playerId: key,
        name: players.find((x) => x.id === key)?.name || key,
        runs: 0,
        wickets: 0,
        points: 0,
      };
      r.runs += p.runs ?? 0;
      r.wickets += p.wickets ?? 0;
      r.points += scorePerformance(p, DEFAULT_WEIGHTS);
      m.set(key, r);
    }
    return Array.from(m.values()).sort((a, b) => b.points - a.points);
  }, [filteredPerfs, players]);

  function exportCsv() {
    const filename = season === "all" ? "leaderboard_all.csv" : `leaderboard_${season}.csv`;
    downloadCsv(
      filename,
      rows.map((r, i) => ({
        rank: i + 1,
        player: r.name,
        runs: r.runs,
        wickets: r.wickets,
        points: r.points,
        season,
      }))
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Status */}
      <div className="rounded-md border bg-white p-3 text-xs text-gray-700 flex flex-wrap gap-3">
        <span><b>Backend:</b> {backend}</span>
        <span><b>Club:</b> {clubId}</span>
        <span><b>Performances:</b> {perfs.length}</span>
        <span><b>Matches:</b> {matches.length}</span>
      </div>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Demo Leaderboard</h1>
          <p className="text-sm text-gray-600">Click a player for game log + sparkline. Points use our MVP engine.</p>
        </div>
        <div className="flex items-center gap-3">
          <SeasonPicker
            dates={matches.map((m) => m.date || "")}
            value={season}
            onChange={setSeason}
          />
          <button className="px-3 py-2 rounded border" onClick={exportCsv} disabled={rows.length === 0}>
            Export CSV
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          <div className="font-semibold mb-1">Error</div>
          <div className="whitespace-pre-wrap break-words">{error}</div>
        </div>
      )}

      <section className="rounded-2xl p-4 shadow bg-white overflow-x-auto">
        <h2 className="font-semibold mb-3">Overall</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-gray-500">No performances yet.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">Player</th>
                <th className="py-2 pr-4">Runs</th>
                <th className="py-2 pr-4">Wickets</th>
                <th className="py-2 pr-4">Points</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.playerId} className="border-t">
                  <td className="py-2 pr-4">{i + 1}</td>
                  <td className="py-2 pr-4">{r.name}</td>
                  <td className="py-2 pr-4">{r.runs}</td>
                  <td className="py-2 pr-4">{r.wickets}</td>
                  <td className="py-2 pr-4 font-semibold">{r.points}</td>
                  <td className="py-2 pr-4">
                    <button
                      className="px-2 py-1 rounded border"
                      onClick={() => setActivePlayerId(r.playerId)}
                    >
                      View log
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Drilldown modal */}
      {activePlayerId && (
        <PlayerModal
          playerId={activePlayerId}
          onClose={() => setActivePlayerId(null)}
          season={season}
          players={players}
          perfs={filteredPerfs}
          matches={matches}
        />
      )}
    </div>
  );
}

/* ========================= Modal Component ========================= */

function PlayerModal({
  playerId,
  onClose,
  season,
  players,
  perfs,
  matches,
}: {
  playerId: string;
  onClose: () => void;
  season: string; // "all" or "YYYY"
  players: DemoPlayer[];
  perfs: DemoPerformance[]; // already season-filtered
  matches: DemoMatch[];
}) {
  const player = players.find((p) => p.id === playerId);
  const name = player?.name || playerId;

  // Build game log: perfs for this player joined with match date/opponent + points
  const log = useMemo(() => {
    const mById = new Map(matches.map((m) => [m.id, m]));
    const mine = perfs
      .filter((p) => p.playerId === playerId)
      .map((p) => {
        const m = mById.get(p.matchId);
        const date = m?.date || "";
        const opponent = m?.opponent || "";
        const points = scorePerformance(p, DEFAULT_WEIGHTS);
        return {
          id: p.id,
          date,
          opponent,
          runs: p.runs ?? 0,
          wickets: p.wickets ?? 0,
          overs: p.overs ?? 0,
          points,
        };
      })
      .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    return mine;
  }, [perfs, matches, playerId]);

  const totals = useMemo(() => {
    return log.reduce(
      (acc, r) => {
        acc.runs += r.runs;
        acc.wickets += r.wickets;
        acc.points += r.points;
        acc.matches += 1;
        return acc;
      },
      { runs: 0, wickets: 0, points: 0, matches: 0 }
    );
  }, [log]);

  const spark = useMemo(
    () =>
      log.map((r) => ({
        date: r.date?.slice(5) || "", // MM-DD for axis
        pts: r.points,
      })),
    [log]
  );

  function exportPlayerCsv() {
    const fname =
      season === "all"
        ? `player_${name.replace(/\s+/g, "_")}_all.csv`
        : `player_${name.replace(/\s+/g, "_")}_${season}.csv`;
    downloadCsv(
      fname,
      log.map((r, i) => ({
        idx: i + 1,
        date: r.date,
        opponent: r.opponent,
        runs: r.runs,
        wickets: r.wickets,
        overs: r.overs,
        points: r.points,
        season,
      }))
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* panel */}
      <div className="relative z-10 w-[min(960px,92vw)] max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-xl">
        <header className="px-5 py-3 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{name}</h3>
            <p className="text-xs text-gray-600">
              {season === "all" ? "All seasons" : `Season ${season}`} · {totals.matches} matches
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded border" onClick={exportPlayerCsv}>
              Export CSV
            </button>
            <button className="px-3 py-1.5 rounded border" onClick={onClose}>
              Close
            </button>
          </div>
        </header>

        <div className="p-5 grid gap-5 md:grid-cols-5">
          {/* Summary cards */}
          <SummaryCard label="Runs" value={totals.runs} />
          <SummaryCard label="Wickets" value={totals.wickets} />
          <SummaryCard label="Points" value={totals.points} />
          <SummaryCard label="Matches" value={totals.matches} />
          <div className="md:col-span-2 md:row-span-2 col-span-1">
            <div className="h-44 border rounded-lg p-2">
              <div className="text-xs text-gray-600 px-1 pb-1">Points sparkline</div>
              {spark.length === 0 ? (
                <div className="h-[140px] flex items-center justify-center text-xs text-gray-500">
                  No games yet
                </div>
              ) : (
                <div className="h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={spark} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="pts" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Log table */}
        <div className="px-5 pb-5">
          <div className="rounded-lg border overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Opponent</th>
                  <th className="py-2 px-3">Runs</th>
                  <th className="py-2 px-3">Wickets</th>
                  <th className="py-2 px-3">Overs</th>
                  <th className="py-2 px-3">Points</th>
                </tr>
              </thead>
              <tbody>
                {log.length === 0 ? (
                  <tr>
                    <td className="py-3 px-3 text-sm text-gray-500" colSpan={7}>
                      No games found for this selection.
                    </td>
                  </tr>
                ) : (
                  log.map((r, i) => (
                    <tr key={r.id} className="border-t">
                      <td className="py-2 px-3">{i + 1}</td>
                      <td className="py-2 px-3">{r.date || "—"}</td>
                      <td className="py-2 px-3">{r.opponent || "—"}</td>
                      <td className="py-2 px-3">{r.runs}</td>
                      <td className="py-2 px-3">{r.wickets}</td>
                      <td className="py-2 px-3">{r.overs}</td>
                      <td className="py-2 px-3 font-semibold">{r.points}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-gray-600">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
