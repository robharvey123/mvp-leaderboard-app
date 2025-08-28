// src/hooks/usePlayerDashboard.ts
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { calcBattingPoints, calcBowlingPoints, Formula } from "@/lib/scoring/engine";

type MatchKey = string; // match_id
type DateISO = string;

type BatRow = {
  match_id: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  dismissal?: string | null;
  matches: { match_date: DateISO; opponent: string | null } | null;
};

type BowlRow = {
  match_id: string;
  overs: number;   // numeric(5,1) in schema
  maidens: number;
  runs: number;
  wickets: number;
  matches: { match_date: DateISO; opponent: string | null } | null;
};

type FieldRow = {
  match_id: string;
  catches: number;
  stumpings: number;
  runouts: number;
  drops: number;
  misfields: number;
  matches: { match_date: DateISO; opponent: string | null } | null;
};

export type PointsRow = {
  match_id: string;
  date: string;      // "Aug 03"
  label: string;     // e.g. "Aug 03 vs Loughton"
  batting: number;
  bowling: number;
  fielding: number;
  points: number;
  runs?: number;
  balls?: number;
  wickets?: number;
  maidens?: number;
  overs?: number;
  runs_conceded?: number;
};

function fmtDate(d: DateISO) {
  const dt = new Date(d);
  return dt.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}

async function getSeasonRange(seasonId?: string) {
  if (!seasonId) {
    const { data, error } = await supabase.from("seasons").select("*").eq("is_active", true).limit(1).maybeSingle();
    if (error) throw error;
    if (!data) return undefined;
    return { start: data.start_date as string, end: data.end_date as string };
  } else {
    const { data, error } = await supabase.from("seasons").select("*").eq("id", seasonId).maybeSingle();
    if (error) throw error;
    if (!data) return undefined;
    return { start: data.start_date as string, end: data.end_date as string };
  }
}

async function getActiveFormula(seasonId?: string): Promise<Formula | null> {
  // Prefer season-scoped active config, fall back to global
  let q = supabase.from("scoring_configs").select("formula_json").eq("is_active", true);
  if (seasonId) q = q.eq("season_id", seasonId);
  const { data } = await q.limit(1).maybeSingle();
  if (data?.formula_json) return data.formula_json as Formula;

  const { data: global } = await supabase
    .from("scoring_configs")
    .select("formula_json")
    .is("season_id", null)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return (global?.formula_json as Formula) ?? null;
}

export function usePlayerDashboard(playerId?: string, seasonId?: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [rows, setRows] = useState<PointsRow[]>([]);
  const [formula, setFormula] = useState<Formula | null>(null);

  useEffect(() => {
    if (!playerId) return;
    (async () => {
      try {
        setLoading(true);
        setError(undefined);

        const range = await getSeasonRange(seasonId);
        if (!range) {
          setRows([]);
          setFormula(null);
          setLoading(false);
          return;
        }

        const activeFormula = await getActiveFormula(seasonId);
        setFormula(activeFormula);

        // Join to matches so we can filter by match_date (season range)
        const [bat, bowl, field] = await Promise.all([
          supabase
            .from("batting_cards")
            .select("match_id,runs,balls,fours,sixes,dismissal,matches!inner(match_date,opponent)")
            .eq("player_id", playerId)
            .gte("matches.match_date", range.start)
            .lte("matches.match_date", range.end)
            .order("match_date", { foreignTable: "matches", ascending: true }) as any,
          supabase
            .from("bowling_cards")
            .select("match_id,overs,maidens,runs,wickets,matches!inner(match_date,opponent)")
            .eq("player_id", playerId)
            .gte("matches.match_date", range.start)
            .lte("matches.match_date", range.end)
            .order("match_date", { foreignTable: "matches", ascending: true }) as any,
          supabase
            .from("fielding_cards")
            .select("match_id,catches,stumpings,runouts,drops,misfields,matches!inner(match_date,opponent)")
            .eq("player_id", playerId)
            .gte("matches.match_date", range.start)
            .lte("matches.match_date", range.end)
            .order("match_date", { foreignTable: "matches", ascending: true }) as any,
        ]);

        if (bat.error || bowl.error || field.error) {
          throw new Error(bat.error?.message || bowl.error?.message || field.error?.message);
        }

        // Index by match
        const byMatch = new Map<MatchKey, PointsRow>();

        const ensure = (m: { match_id: string; matches: { match_date: DateISO; opponent: string | null } | null }) => {
          const key = m.match_id;
          if (!byMatch.has(key)) {
            const dateStr = m.matches ? fmtDate(m.matches.match_date) : "";
            const label = m.matches?.opponent ? `${dateStr} vs ${m.matches.opponent}` : dateStr;
            byMatch.set(key, {
              match_id: key,
              date: dateStr,
              label,
              batting: 0,
              bowling: 0,
              fielding: 0,
              points: 0,
            });
          }
          return byMatch.get(key)!;
        };

        // Batting
        (bat.data as BatRow[]).forEach((r) => {
          const row = ensure(r);
          row.runs = r.runs ?? 0;
          row.balls = r.balls ?? 0;

          if (activeFormula) {
            row.batting += calcBattingPoints(activeFormula.batting, {
              runs: r.runs ?? 0,
              balls: r.balls ?? 0,
              fours: r.fours ?? 0,
              sixes: r.sixes ?? 0,
              dismissal: r.dismissal ?? undefined,
            });
          }
        });

        // Bowling
        (bowl.data as BowlRow[]).forEach((r) => {
          const row = ensure(r);
          row.overs = r.overs ?? 0;
          row.maidens = r.maidens ?? 0;
          row.runs_conceded = r.runs ?? 0;
          row.wickets = r.wickets ?? 0;

          if (activeFormula) {
            row.bowling += calcBowlingPoints(activeFormula.bowling, {
              overs: r.overs ?? 0,
              maidens: r.maidens ?? 0,
              runs: r.runs ?? 0,
              wickets: r.wickets ?? 0,
            });
          }
        });

        // Fielding
        (field.data as FieldRow[]).forEach((r) => {
          const row = ensure(r);
          if (activeFormula) {
            const f = activeFormula.fielding;
            const val =
              (r.catches ?? 0) * f.catch +
              (r.stumpings ?? 0) * f.stumping +
              (r.runouts ?? 0) * f.runout +
              (r.drops ?? 0) * (f.drop_penalty ?? 0) +
              (r.misfields ?? 0) * (f.misfield_penalty ?? 0);
            row.fielding += val;
          }
        });

        // Total points
        byMatch.forEach((v) => (v.points = (v.batting ?? 0) + (v.bowling ?? 0) + (v.fielding ?? 0)));

        setRows(Array.from(byMatch.values()).sort((a, b) => a.date.localeCompare(b.date)));
      } catch (e: any) {
        setError(e?.message || "Failed to load player dashboard");
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [playerId, seasonId]);

  const charts = useMemo(() => {
    const pointsTrend = rows.map((r) => ({
      match: r.label,
      points: r.points,
      batting: r.batting,
      bowling: r.bowling,
      fielding: r.fielding,
    }));

    const battingTrend = rows.map((r) => ({
      match: r.label,
      runs: r.runs ?? 0,
      balls: r.balls ?? 0,
    }));

    const bowlingSeries = rows.map((r) => ({
      match: r.label,
      overs: r.overs ?? 0,
      maidens: r.maidens ?? 0,
      wickets: r.wickets ?? 0,
      runs: r.runs_conceded ?? 0,
    }));

    return { pointsTrend, battingTrend, bowlingSeries };
  }, [rows]);

  return { loading, error, formula, rows, charts };
}
