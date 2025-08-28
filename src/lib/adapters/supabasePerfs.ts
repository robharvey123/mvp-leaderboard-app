// src/lib/adapters/supabasePerfs.ts
import { getSupabase } from "@/lib/supabaseClient";
import { getActiveClubId } from "@/lib/club";

export type RemotePerformance = {
  id: string;
  club_id: string;
  match_id: string;
  player_id: string;
  runs?: number | null;
  fours?: number | null;
  sixes?: number | null;
  overs?: number | null;
  maidens?: number | null;
  runs_conceded?: number | null;
  wickets?: number | null;
  catches?: number | null;
  stumpings?: number | null;
  runouts?: number | null;
};

function assertEnv(sb: any, clubId: string | null) {
  if (!sb) throw new Error("Supabase not configured (missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
  if (!clubId) throw new Error("No club selected. Set VITE_CLUB_ID or pick a club (org:last).");
}
function isMissingColumnError(e: any) {
  const msg = (e?.message || e?.hint || e?.details || "").toString().toLowerCase();
  return msg.includes("column") && msg.includes("does not exist");
}
function mapOut(d: any) {
  return {
    id: d.id,
    club_id: d.club_id,
    match_id: d.match_id,
    player_id: d.player_id,
    runs: d.runs ?? undefined,
    fours: d.fours ?? undefined,
    sixes: d.sixes ?? undefined,
    overs: d.overs ?? undefined,
    maidens: d.maidens ?? undefined,
    runs_conceded: d.runs_conceded ?? undefined,
    wickets: d.wickets ?? undefined,
    catches: d.catches ?? undefined,
    stumpings: d.stumpings ?? undefined,
    runouts: d.runouts ?? undefined,
  } as RemotePerformance;
}

export const supabasePerfs = {
  async list(matchId?: string) {
    const sb = getSupabase();
    const clubId = getActiveClubId();
    assertEnv(sb, clubId);

    let q = sb!.from("performances")
      .select("id,club_id,match_id,player_id,runs,fours,sixes,overs,maidens,runs_conceded,wickets,catches,stumpings,runouts")
      .eq("club_id", clubId!);

    if (matchId) q = q.eq("match_id", matchId);

    let { data, error, status } = await q.order("created_at", { ascending: true });

    if (error && isMissingColumnError(error)) {
      // super minimal fallback
      const retry = await sb!.from("performances")
        .select("id,club_id,match_id,player_id")
        .eq("club_id", clubId!)
        .maybeSingle(); // not ordered; may return null if using maybeSingle — handle below
      if (retry.error) { error = retry.error; status = retry.status; }
      else data = retry.data ? [retry.data] : [];
    }
    if (error) {
      const err: any = new Error(error.message || "performances list failed");
      err.status = status; err.details = error.details || error.hint;
      throw err;
    }
    // If we used maybeSingle fallback, data is a single row; normalize
    return Array.isArray(data) ? data.map(mapOut) : [mapOut(data)];
  },

  async add(input: Omit<RemotePerformance, "id" | "club_id">) {
    const sb = getSupabase();
    const clubId = getActiveClubId();
    assertEnv(sb, clubId);

    let payload: any = { ...input, club_id: clubId! };

    let res = await sb!
      .from("performances")
      .insert(payload)
      .select("id,club_id,match_id,player_id,runs,fours,sixes,overs,maidens,runs_conceded,wickets,catches,stumpings,runouts")
      .single();

    if (res.error && isMissingColumnError(res.error)) {
      // retry with minimal required fields
      const minimal = { club_id: clubId!, match_id: input.match_id, player_id: input.player_id };
      res = await sb!.from("performances").insert(minimal).select("id,club_id,match_id,player_id").single();
    }
    if (res.error) {
      const err: any = new Error(res.error.message || "performances add failed");
      err.status = res.status; err.details = res.error.details || res.error.hint;
      throw err;
    }
    return mapOut(res.data);
  },

  async remove(id: string) {
    const sb = getSupabase();
    const clubId = getActiveClubId();
    assertEnv(sb, clubId);

    const { error, status } = await sb!.from("performances").delete().eq("id", id);
    if (error) {
      const err: any = new Error(error.message || "performances delete failed");
      err.status = status; err.details = error.details || error.hint;
      throw err;
    }
  },
};
