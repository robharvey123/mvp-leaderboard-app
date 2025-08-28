// src/import/ensureZeroRows.ts
import { supabase } from "@/lib/supabaseClient";

/**
 * Ensures every selected player has *some* card row in this match.
 * If a player has no batting/bowling/fielding rows, we insert zeros in all 3 tables.
 *
 * @param matchId  Match UUID
 * @param teamId   Team UUID (not strictly required but useful if you extend constraints)
 * @param playerIds  Squad player UUIDs you want guaranteed to appear in reports
 */
export async function ensureZeroRows(
  matchId: string,
  teamId: string,
  playerIds: string[]
): Promise<{ createdTriples: number; createdRows: number; missingPlayerIds: string[] }> {
  // 1) Who already has any card?
  const [bat, bowl, field] = await Promise.all([
    supabase.from("batting_cards").select("player_id").eq("match_id", matchId),
    supabase.from("bowling_cards").select("player_id").eq("match_id", matchId),
    supabase.from("fielding_cards").select("player_id").eq("match_id", matchId),
  ]);

  if (bat.error) throw bat.error;
  if (bowl.error) throw bowl.error;
  if (field.error) throw field.error;

  const hasAny = new Set<string>([
    ...(bat.data ?? []).map((r: any) => r.player_id),
    ...(bowl.data ?? []).map((r: any) => r.player_id),
    ...(field.data ?? []).map((r: any) => r.player_id),
  ]);

  const missing = playerIds.filter((id) => !hasAny.has(id));
  if (!missing.length) return { createdTriples: 0, createdRows: 0, missingPlayerIds: [] };

  // 2) Build zero rows for each table
  // Adjust fields to match your schema (keep them minimal + safe).
  const zerosBat = missing.map((id) => ({
    match_id: matchId,
    player_id: id,
    position: 0,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    dismissal: "Did not bat",
    // strike_rate: 0, // uncomment only if column exists
  }));

  const zerosBowl = missing.map((id) => ({
    match_id: matchId,
    player_id: id,
    overs: 0,
    maidens: 0,
    runs: 0,
    wickets: 0,
    // economy: 0, // uncomment only if column exists
  }));

  const zerosFld = missing.map((id) => ({
    match_id: matchId,
    player_id: id,
    catches: 0,
    stumpings: 0,
    runouts: 0,
    drops: 0,
    misfields: 0,
  }));

  // 3) Insert (or upsert if you later add a unique index on (match_id, player_id))
  const [i1, i2, i3] = await Promise.all([
    supabase.from("batting_cards").insert(zerosBat),
    supabase.from("bowling_cards").insert(zerosBowl),
    supabase.from("fielding_cards").insert(zerosFld),
    // If you add a unique constraint, switch to:
    // supabase.from("batting_cards").upsert(zerosBat, { onConflict: "match_id,player_id", ignoreDuplicates: true })
  ]);

  if (i1.error || i2.error || i3.error) throw (i1.error || i2.error || i3.error);

  const createdRows =
    (i1.data?.length ?? zerosBat.length) +
    (i2.data?.length ?? zerosBowl.length) +
    (i3.data?.length ?? zerosFld.length);

  return {
    createdTriples: missing.length,
    createdRows,
    missingPlayerIds: missing,
  };
}
