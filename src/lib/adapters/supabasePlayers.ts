// src/lib/adapters/supabasePlayers.ts
import { supabase } from "@/lib/supabaseClient";

export type Player = {
  id: string;
  full_name: string;
  created_at?: string;
};

/**
 * List players (optionally filter by name, limit results).
 */
export async function listPlayers(opts: {
  search?: string;
  limit?: number;
} = {}): Promise<Player[]> {
  let q = supabase
    .from("players")
    .select("id, full_name, created_at")
    .order("full_name", { ascending: true });

  if (opts.search?.trim()) q = q.ilike("full_name", `%${opts.search.trim()}%`);
  if (opts.limit) q = q.limit(opts.limit);

  const { data, error } = await q;
  if (error) throw new Error(`[players] list: ${error.message}`);
  return (data as Player[]) ?? [];
}

/**
 * Get a single player by id.
 */
export async function getPlayerById(id: string): Promise<Player | null> {
  const { data, error } = await supabase
    .from("players")
    .select("id, full_name, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`[players] getById: ${error.message}`);
  return (data as Player) ?? null;
}

/**
 * Create or update a player.
 * Pass { id, full_name } to update by id, or just { full_name } to insert.
 */
export async function upsertPlayer(input: {
  id?: string;
  full_name: string;
}): Promise<Player> {
  const row: Record<string, any> = { full_name: input.full_name.trim() };
  if (input.id) row.id = input.id;

  const { data, error } = await supabase
    .from("players")
    .upsert(row, { onConflict: "id" })
    .select()
    .single();

  if (error) throw new Error(`[players] upsert: ${error.message}`);
  return data as Player;
}

/**
 * Ensure a player exists by name (returns the row).
 */
export async function ensurePlayerByName(full_name: string): Promise<Player> {
  const name = full_name.trim();
  // try exact match first
  const { data: existing, error: selErr } = await supabase
    .from("players")
    .select("id, full_name, created_at")
    .eq("full_name", name)
    .maybeSingle();
  if (selErr) throw new Error(`[players] ensure select: ${selErr.message}`);
  if (existing) return existing as Player;

  // otherwise insert
  const { data, error } = await supabase
    .from("players")
    .insert({ full_name: name })
    .select()
    .single();
  if (error) throw new Error(`[players] ensure insert: ${error.message}`);
  return data as Player;
}

export default {
  listPlayers,
  getPlayerById,
  upsertPlayer,
  ensurePlayerByName,
};
