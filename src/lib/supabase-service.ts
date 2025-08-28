// src/lib/supabase-service.ts
/**
 * Supabase Service — write & read helpers for the MVP.
 * - Uses the canonical client from '@/lib/supabaseClient'
 * - Idempotent upserts for cards (match_id, player_id)
 * - Calls ensureZeroRows after saving a match
 */

import { getSupabaseClient } from "@/lib/supabaseClient";
import { ensureZeroRows } from "@/lib/import/ensureZeroRows";

// Optional (remove if unused)
import { MVPCalculator } from "@/lib/mvp-calculator";

const supabase = getSupabaseClient();

export type BattingRow = {
  player_id: string;
  position?: number | null;
  runs: number;
  balls: number;
  fours?: number;
  sixes?: number;
  dismissal?: string | null;
  strike_rate?: number | null;
  derived?: boolean;
};

export type BowlingRow = {
  player_id: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  economy?: number | null;
  derived?: boolean;
};

export type FieldingRow = {
  player_id: string;
  catches?: number;
  stumpings?: number;
  runouts?: number;
  drops?: number;
  misfields?: number;
  derived?: boolean;
};

export type ParsedMatch = {
  club_id: string;
  team_id: string;
  match_date: string; // YYYY-MM-DD
  opponent: string;
  venue?: string | null;
  toss?: string | null;
  result?: string | null;
  source?: "pdf" | "csv" | "manual";
  notes?: string | null;

  batting: BattingRow[];
  bowling: BowlingRow[];
  fielding: FieldingRow[];
};

export type SaveResult = { matchId: string };

const TABLES = {
  matches: "matches",
  batting: "batting_cards",
  bowling: "bowling_cards",
  fielding: "fielding_cards",
  squads: "squads",
  seasons: "seasons",
  teams: "teams",
} as const;

function chunk<T>(arr: T[], n = 200): T[][] {
  if (!arr?.length) return [];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

/* ---------- Lookups ---------- */
export async function getTeamByName(club_id: string, name: string) {
  const { data, error } = await supabase
    .from(TABLES.teams)
    .select("id")
    .eq("club_id", club_id)
    .eq("name", name)
    .maybeSingle();
  if (error) throw error;
  return data?.id as string | undefined;
}

export async function getSeasonByDate(club_id: string, dateISO: string) {
  const { data, error } = await supabase
    .from(TABLES.seasons)
    .select("id")
    .eq("club_id", club_id)
    .lte("start_date", dateISO)
    .gte("end_date", dateISO)
    .maybeSingle();
  if (error) throw error;
  return data?.id as string | undefined;
}

export async function getActiveSeason(club_id: string) {
  const { data, error } = await supabase
    .from(TABLES.seasons)
    .select("id")
    .eq("club_id", club_id)
    .eq("is_active", true)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id as string | undefined;
}

export async function getSquadPlayerIds(team_id: string, season_id: string) {
  const { data, error } = await supabase
    .from(TABLES.squads)
    .select("player_id")
    .eq("team_id", team_id)
    .eq("season_id", season_id);
  if (error) throw error;
  return (data || []).map((r) => r.player_id as string);
}

/* ---------- Core save flow ---------- */
export async function saveParsedMatch(match: ParsedMatch): Promise<SaveResult> {
  // 1) Create match
  const { data: matchRow, error: matchErr } = await supabase
    .from(TABLES.matches)
    .insert({
      club_id: match.club_id,
      team_id: match.team_id,
      match_date: match.match_date,
      opponent: match.opponent,
      venue: match.venue ?? null,
      toss: match.toss ?? null,
      result: match.result ?? null,
      source: match.source ?? "manual",
      parse_status: "imported",
      notes: match.notes ?? null,
    })
    .select("id")
    .single();

  if (matchErr || !matchRow) throw matchErr ?? new Error("Failed to create match");
  const matchId = matchRow.id as string;

  // 2) Upsert cards (idempotent on match_id+player_id)
  const batRows = (match.batting || []).map((r) => ({
    match_id: matchId,
    player_id: r.player_id,
    position: r.position ?? null,
    runs: r.runs ?? 0,
    balls: r.balls ?? 0,
    fours: r.fours ?? 0,
    sixes: r.sixes ?? 0,
    dismissal: r.dismissal ?? null,
    strike_rate: r.strike_rate ?? null,
    derived: false,
  }));

  const bowlRows = (match.bowling || []).map((r) => ({
    match_id: matchId,
    player_id: r.player_id,
    overs: r.overs ?? 0,
    maidens: r.maidens ?? 0,
    runs: r.runs ?? 0,
    wickets: r.wickets ?? 0,
    economy: r.economy ?? null,
    derived: false,
  }));

  const fieldRows = (match.fielding || []).map((r) => ({
    match_id: matchId,
    player_id: r.player_id,
    catches: r.catches ?? 0,
    stumpings: r.stumpings ?? 0,
    runouts: r.runouts ?? 0,
    drops: r.drops ?? 0,
    misfields: r.misfields ?? 0,
    derived: false,
  }));

  for (const group of chunk(batRows)) {
    const { error } = await supabase
      .from(TABLES.batting)
      .upsert(group, { onConflict: "match_id,player_id", ignoreDuplicates: true });
    if (error) throw error;
  }
  for (const group of chunk(bowlRows)) {
    const { error } = await supabase
      .from(TABLES.bowling)
      .upsert(group, { onConflict: "match_id,player_id", ignoreDuplicates: true });
    if (error) throw error;
  }
  for (const group of chunk(fieldRows)) {
    const { error } = await supabase
      .from(TABLES.fielding)
      .upsert(group, { onConflict: "match_id,player_id", ignoreDuplicates: true });
    if (error) throw error;
  }

  // 3) All‑Players rule
  await ensureZeroRows(matchId);

  return { matchId };
}

export async function saveParsedMatches(matches: ParsedMatch[]) {
  const results: SaveResult[] = [];
  for (const m of matches) results.push(await saveParsedMatch(m));
  return results;
}

/* ---------- Fetch helpers (handy for UI/debug) ---------- */
export async function getMatchById(matchId: string) {
  const { data, error } = await supabase.from(TABLES.matches).select("*").eq("id", matchId).maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function getCardsForMatch(matchId: string) {
  const [bat, bowl, field] = await Promise.all([
    supabase.from(TABLES.batting).select("*").eq("match_id", matchId).order("position", { ascending: true }),
    supabase.from(TABLES.bowling).select("*").eq("match_id", matchId),
    supabase.from(TABLES.fielding).select("*").eq("match_id", matchId),
  ]);
  if (bat.error) throw bat.error;
  if (bowl.error) throw bowl.error;
  if (field.error) throw field.error;

  return { batting: bat.data || [], bowling: bowl.data || [], fielding: field.data || [] };
}

/* ---------- Default export (optional convenience) ---------- */
const SupabaseService = {
  saveParsedMatch,
  saveParsedMatches,
  getTeamByName,
  getSeasonByDate,
  getActiveSeason,
  getSquadPlayerIds,
  getMatchById,
  getCardsForMatch,
};

export default SupabaseService;
