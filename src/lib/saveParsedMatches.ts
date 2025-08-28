// src/lib/saveParsedMatches.ts
import { supabase } from "./supabaseClient";
import { ensureZeroRows } from "./import/ensureZeroRows";

/**
 * Types for a parsed match payload coming from your CSV/PDF parser.
 * Keep these simple: IDs must already exist for club/team/players.
 */
export type BattingRow = {
  player_id: string;
  position?: number | null;
  runs: number;
  balls: number;
  fours?: number;
  sixes?: number;
  dismissal?: string | null;
  strike_rate?: number | null;
};

export type BowlingRow = {
  player_id: string;
  overs: number;       // e.g. 8 or 8.0
  maidens: number;
  runs: number;
  wickets: number;
  economy?: number | null;
};

export type FieldingRow = {
  player_id: string;
  catches?: number;
  stumpings?: number;
  runouts?: number;
  drops?: number;
  misfields?: number;
};

export type ParsedMatch = {
  club_id: string;           // club UUID
  team_id: string;           // team UUID
  match_date: string;        // 'YYYY-MM-DD'
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

export type SaveResult = {
  matchId: string;
};

/**
 * Utility: chunk arrays to avoid large payloads to Supabase
 */
function chunk<T>(arr: T[], n = 200): T[][] {
  if (!arr.length) return [];
  const groups: T[][] = [];
  for (let i = 0; i < arr.length; i += n) groups.push(arr.slice(i, i + n));
  return groups;
}

/**
 * Save ONE parsed match, then ensure zero-rows for all squad players.
 * Returns the created match id.
 */
export async function saveParsedMatch(match: ParsedMatch): Promise<SaveResult> {
  // 1) Create the match row
  const { data: matchRow, error: matchErr } = await supabase
    .from("matches")
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

  if (matchErr || !matchRow) {
    throw matchErr ?? new Error("Failed to create match");
  }

  const matchId = matchRow.id as string;

  // 2) Upsert batting/bowling/fielding cards
  //    We rely on UNIQUE (match_id, player_id) on each table
  //    and `onConflict: "match_id,player_id"` so re-imports are safe.

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
    derived: false, // real row, not auto-zero
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

  // Upsert in chunks for safety
  for (const group of chunk(batRows)) {
    const { error } = await supabase
      .from("batting_cards")
      .upsert(group, { onConflict: "match_id,player_id", ignoreDuplicates: true });
    if (error) throw error;
  }

  for (const group of chunk(bowlRows)) {
    const { error } = await supabase
      .from("bowling_cards")
      .upsert(group, { onConflict: "match_id,player_id", ignoreDuplicates: true });
    if (error) throw error;
  }

  for (const group of chunk(fieldRows)) {
    const { error } = await supabase
      .from("fielding_cards")
      .upsert(group, { onConflict: "match_id,player_id", ignoreDuplicates: true });
    if (error) throw error;
  }

  // 3) Guarantee “All‑Players” visibility:
  //    create zeroed rows for any squad member who didn’t bat/bowl/field.
  await ensureZeroRows(matchId);

  return { matchId };
}

/**
 * Save MANY parsed matches in one go.
 * Calls ensureZeroRows for each match after upserts.
 */
export async function saveParsedMatches(matches: ParsedMatch[]): Promise<SaveResult[]> {
  const results: SaveResult[] = [];
  for (const m of matches) {
    const res = await saveParsedMatch(m);
    results.push(res);
  }
  return results;
}
