// src/lib/adapters/supabaseMatches.ts
import { supabase } from "@/lib/supabaseClient";
import { getActiveClubId } from "@/lib/club";

export type RemoteMatch = {
  id: string;
  club_id: string;
  date?: string | null;     // normalized for UI
  opponent?: string | null;
};

function assertEnv(sb: any, clubId: string | null) {
  if (!sb) throw new Error("Supabase not configured (missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
  if (!clubId) throw new Error("No club selected. Set VITE_CLUB_ID or pick a club (org:last).");
}
function isMissingColumnError(e: any) {
  const msg = (e?.message || e?.hint || e?.details || "").toString().toLowerCase();
  return msg.includes("column") && msg.includes("does not exist");
}

// --- date column detection & cache ----
const CANDIDATES = ["date", "match_date", "played_at", "start_date"] as const;
type Candidate = typeof CANDIDATES[number];

let cachedDateCol: Candidate | null | undefined; // undefined = not checked yet
function loadCache(): Candidate | null | undefined {
  if (typeof window === "undefined") return undefined;
  const v = localStorage.getItem("matches:dateCol");
  return v ? (v as Candidate) : null;
}
function saveCache(col: Candidate | null) {
  if (typeof window === "undefined") return;
  if (col) localStorage.setItem("matches:dateCol", col);
  else localStorage.removeItem("matches:dateCol");
}

async function detectDateCol(sb: any): Promise<Candidate | null> {
  if (cachedDateCol === undefined) cachedDateCol = loadCache();
  if (cachedDateCol !== undefined) return cachedDateCol ?? null;

  for (const col of CANDIDATES) {
    const { error } = await sb.from("matches").select(`id, ${col}`).limit(1);
    if (!error) {
      cachedDateCol = col;
      saveCache(col);
      return col;
    }
  }
  cachedDateCol = null;
  saveCache(null);
  return null;
}

function mapOut(row: any, dateCol: Candidate | null): RemoteMatch {
  const raw = dateCol ? row[dateCol] : undefined;
  return {
    id: row.id,
    club_id: row.club_id,
    date: raw ?? undefined,
    opponent: row.opponent ?? undefined,
  };
}

export const supabaseMatches = {
  /** List matches for active club, ordering by whichever date-like column exists (if any). */
  async list(): Promise<RemoteMatch[]> {
    const sb = getSupabase();
    const clubId = getActiveClubId();
    assertEnv(sb, clubId);

    const dateCol = await detectDateCol(sb);

    const selectCols = ["id", "club_id", "opponent"].concat(dateCol ? [dateCol] : []).join(",");
    let q = sb.from("matches").select(selectCols).eq("club_id", clubId!);
    if (dateCol) q = q.order(dateCol, { ascending: true });

    let { data, error, status } = await q;

    // If selected/ordered column 404s, retry minimal and invalidate cache
    if (error && isMissingColumnError(error)) {
      const retry = await sb.from("matches").select("id,club_id,opponent").eq("club_id", clubId!);
      data = retry.data; error = retry.error; status = retry.status;
      if (!retry.error) {
        cachedDateCol = null;
        saveCache(null);
      }
    }

    if (error) {
      const err: any = new Error(error.message || "matches list failed");
      err.status = status; err.details = error.details || error.hint;
      throw err;
    }

    // ✅ FIX: no `await` inside map — compute once and use
    const dateColForMap: Candidate | null = (cachedDateCol ?? dateCol) ?? null;
    return (data ?? []).map((r: any) => mapOut(r, dateColForMap));
  },

  /** Create a match; writes to the detected date column if present. */
  async create(input: { date?: string; opponent?: string }): Promise<RemoteMatch> {
    const sb = getSupabase();
    const clubId = getActiveClubId();
    assertEnv(sb, clubId);

    const dateCol = await detectDateCol(sb);
    let payload: any = { club_id: clubId!, opponent: input.opponent ?? null };
    if (dateCol && input.date) payload[dateCol] = input.date;

    let res = await sb.from("matches")
      .insert(payload)
      .select(["id","club_id","opponent"].concat(dateCol ? [dateCol] : []).join(","))
      .single();

    if (res.error && isMissingColumnError(res.error)) {
      cachedDateCol = null; saveCache(null);
      res = await sb.from("matches")
        .insert({ club_id: clubId!, opponent: input.opponent ?? null })
        .select("id,club_id,opponent")
        .single();
    }
    if (res.error) {
      const err: any = new Error(res.error.message || "matches create failed");
      err.status = res.status; err.details = res.error.details || res.error.hint;
      throw err;
    }
    return mapOut(res.data, dateCol ?? null);
  },

  /** Update a match; only sets the detected date column if present. */
  async update(id: string, patch: Partial<{ date?: string; opponent?: string }>): Promise<RemoteMatch> {
    const sb = getSupabase();
    const clubId = getActiveClubId();
    assertEnv(sb, clubId);

    const dateCol = await detectDateCol(sb);
    const upd: any = {};
    if (typeof patch.opponent !== "undefined") upd.opponent = patch.opponent ?? null;
    if (dateCol && typeof patch.date !== "undefined") upd[dateCol] = patch.date ?? null;

    let res = await sb.from("matches")
      .update(upd)
      .eq("id", id)
      .select(["id","club_id","opponent"].concat(dateCol ? [dateCol] : []).join(","))
      .single();

    if (res.error && isMissingColumnError(res.error)) {
      cachedDateCol = null; saveCache(null);
      const minimal = typeof patch.opponent !== "undefined" ? { opponent: patch.opponent ?? null } : {};
      res = await sb.from("matches")
        .update(minimal)
        .eq("id", id)
        .select("id,club_id,opponent")
        .single();
    }
    if (res.error) {
      const err: any = new Error(res.error.message || "matches update failed");
      err.status = res.status; err.details = res.error.details || res.error.hint;
      throw err;
    }
    return mapOut(res.data, dateCol ?? null);
  },

  async remove(id: string): Promise<void> {
    const sb = getSupabase();
    const clubId = getActiveClubId();
    assertEnv(sb, clubId);

    const { error, status } = await sb.from("matches").delete().eq("id", id);
    if (error) {
      const err: any = new Error(error.message || "matches delete failed");
      err.status = status; err.details = error.details || error.hint;
      throw err;
    }
  },
};
