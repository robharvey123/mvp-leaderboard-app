// src/hooks/useTeamStats.ts
import { useEffect, useMemo, useState } from "react";

// Supabase is optional: we'll try to import it, but keep working without it.
let supabase: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  supabase = require("@/lib/supabaseClient").supabase;
} catch {
  /* noop — mock data mode */
}

type ResultRow = { id: string; opponent?: string; match_date?: string; result?: string };
type BattingRow = { match_id: string; position?: number | null; runs?: number | null };
type BowlingRow = { match_id: string; wickets?: number | null };

export type TeamStatsCharts = {
  resultTrend: { match: string; resultPts: number }[];
  battingSplit: { match: string; top: number; middle: number; lower: number }[];
  bowlingReturns: { match: string; threeFors: number; fiveFors: number }[];
};

export type TeamStatsMeta = { teamName?: string; seasonName?: string };

type HookState = {
  loading: boolean;
  error?: string;
  charts?: TeamStatsCharts;
  meta?: TeamStatsMeta;
};

export function useTeamStats(teamId?: string, seasonId?: string) {
  const [state, setState] = useState<HookState>({ loading: true });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!teamId) {
        setState({ loading: false, error: "No teamId provided." });
        return;
      }

      try {
        if (supabase) {
          // --- Load matches for the team (and season if you have a foreign key) ---
          const { data: matches, error: mErr } = await supabase
            .from("matches")
            .select("id, opponent, match_date, result")
            .eq("team_id", teamId)
            .order("match_date", { ascending: true });

          if (mErr) throw mErr;

          const matchIds = (matches as ResultRow[]).map((m) => m.id);
          // If no matches yet, bail early with empty charts
          if (!matchIds.length) {
            if (!cancelled) {
              setState({
                loading: false,
                charts: emptyCharts(),
                meta: { teamName: "Team", seasonName: "" },
              });
            }
            return;
          }

          // --- Batting cards for those matches ---
          const { data: batting, error: bErr } = await supabase
            .from("batting_cards")
            .select("match_id, position, runs")
            .in("match_id", matchIds);

          if (bErr) throw bErr;

          // --- Bowling cards for those matches ---
          const { data: bowling, error: bwErr } = await supabase
            .from("bowling_cards")
            .select("match_id, wickets")
            .in("match_id", matchIds);

          if (bwErr) throw bwErr;

          // Build charts
          const charts = buildCharts(matches as ResultRow[], batting as BattingRow[], bowling as BowlingRow[]);
          const meta: TeamStatsMeta = { teamName: "Team", seasonName: "" }; // You can improve with real names

          if (!cancelled) setState({ loading: false, charts, meta });
        } else {
          // --- Mock mode (no Supabase configured) ---
          const { matches, batting, bowling } = synthMock();
          const charts = buildCharts(matches, batting, bowling);
          if (!cancelled) setState({ loading: false, charts, meta: { teamName: "Team (mock)", seasonName: "2025" } });
        }
      } catch (e: any) {
        if (!cancelled) {
          setState({
            loading: false,
            error: e?.message ?? "Failed to load team stats",
            charts: emptyCharts(),
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [teamId, seasonId]);

  // Always return a stable object (avoids undefined checks in callers)
  const charts = useMemo(() => state.charts ?? emptyCharts(), [state.charts]);
  return { loading: state.loading, error: state.error, charts, meta: state.meta };
}

// ----------------- helpers -----------------

function emptyCharts(): TeamStatsCharts {
  return { resultTrend: [], battingSplit: [], bowlingReturns: [] };
}

// +1 for win, 0 for tie/no result, -1 for loss (adjust if your schema differs)
function resultToPts(result?: string): number {
  const r = (result || "").toLowerCase();
  if (r.includes("win")) return 1;
  if (r.includes("loss") || r.includes("lost")) return -1;
  return 0; // tie, abandoned, NR, etc.
}

function matchLabel(m: ResultRow, idx: number) {
  const date = m.match_date ? ` (${m.match_date})` : "";
  const opp = m.opponent ? ` vs ${m.opponent}` : "";
  return `M${String(idx + 1).padStart(2, "0")}${opp}${date}`;
}

function buildCharts(
  matches: ResultRow[],
  batting: BattingRow[],
  bowling: BowlingRow[]
): TeamStatsCharts {
  const byMatch = new Map<string, ResultRow>();
  matches.forEach((m) => byMatch.set(m.id, m));

  // A) Results trend
  const resultTrend = matches.map((m, i) => ({
    match: matchLabel(m, i),
    resultPts: resultToPts(m.result),
  }));

  // B) Batting contribution split (top 1-3, middle 4-7, lower 8-11)
  const battingByMatch = new Map<
    string,
    { top: number; middle: number; lower: number }
  >();

  batting.forEach((b) => {
    const key = b.match_id;
    if (!battingByMatch.has(key)) battingByMatch.set(key, { top: 0, middle: 0, lower: 0 });

    const pos = typeof b.position === "number" ? b.position : 0;
    const runs = typeof b.runs === "number" ? b.runs : 0;
    const bucket = battingByMatch.get(key)!;

    if (pos >= 1 && pos <= 3) bucket.top += runs;
    else if (pos >= 4 && pos <= 7) bucket.middle += runs;
    else bucket.lower += runs;
  });

  const battingSplit = matches.map((m, i) => {
    const agg = battingByMatch.get(m.id) ?? { top: 0, middle: 0, lower: 0 };
    return { match: matchLabel(m, i), ...agg };
  });

  // C) Bowling returns: count of 3-fors and 5-fors per match
  const returnsByMatch = new Map<string, { threeFors: number; fiveFors: number }>();
  bowling.forEach((bw) => {
    const key = bw.match_id;
    if (!returnsByMatch.has(key)) returnsByMatch.set(key, { threeFors: 0, fiveFors: 0 });
    const w = typeof bw.wickets === "number" ? bw.wickets : 0;
    const agg = returnsByMatch.get(key)!;
    if (w >= 3) agg.threeFors += 1;
    if (w >= 5) agg.fiveFors += 1;
  });

  const bowlingReturns = matches.map((m, i) => {
    const agg = returnsByMatch.get(m.id) ?? { threeFors: 0, fiveFors: 0 };
    return { match: matchLabel(m, i), ...agg };
  });

  return { resultTrend, battingSplit, bowlingReturns };
}

// Simple mock generator so the page looks alive without DB
function synthMock() {
  const matches: ResultRow[] = [
    { id: "m1", opponent: "Chipping Ongar", match_date: "2025-05-01", result: "Win" },
    { id: "m2", opponent: "Navestock", match_date: "2025-05-08", result: "Loss" },
    { id: "m3", opponent: "Hutton", match_date: "2025-05-15", result: "Win" },
    { id: "m4", opponent: "High Roding", match_date: "2025-05-22", result: "Tie" },
    { id: "m5", opponent: "Stock", match_date: "2025-05-29", result: "Win" },
  ];

  const batting: BattingRow[] = [];
  const bowling: BowlingRow[] = [];
  matches.forEach((m) => {
    // 11 batting positions per match with synthetic runs
    for (let pos = 1; pos <= 11; pos++) {
      batting.push({
        match_id: m.id,
        position: pos,
        runs: Math.max(0, Math.round(Math.random() * (pos <= 3 ? 35 : pos <= 7 ? 25 : 12))),
      });
    }
    // 5 bowlers per match with synthetic wickets
    for (let b = 0; b < 5; b++) {
      const wkts = Math.random() < 0.15 ? 5 : Math.random() < 0.35 ? 3 : Math.round(Math.random() * 2);
      bowling.push({ match_id: m.id, wickets: wkts });
    }
  });

  return { matches, batting, bowling };
}
