import { createClient } from "jsr:@supabase/supabase-js@2";
const BASE = "https://www.play-cricket.com/api/v2";

/* CORS */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Input = { clubId: string; season?: string; fullResync?: boolean };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
    const { clubId, season, fullResync }: Input = await req.json();
    if (!clubId) return json({ error: "clubId required" }, 400);

    const supabase = createServiceClient();

    // Load club settings
    const { data: settings, error: sErr } = await supabase
      .from("integration_playcricket_settings")
      .select("*")
      .eq("club_id", clubId)
      .single();
    if (sErr || !settings) return json({ error: "No Play-Cricket settings for club" }, 400);

    const siteId: number = settings.site_id;
    const token: string = settings.api_token;
    const seasonStr = season ?? settings.default_season ?? String(new Date().getFullYear());

    const params = new URLSearchParams({ site_id: String(siteId), season: seasonStr, api_token: token });
    if (!fullResync && settings.last_entry_cursor) params.set("from_entry_date", settings.last_entry_cursor);

    // Fetch result summaries
    const res = await fetch(`${BASE}/result_summary.json?${params.toString()}`);
    if (!res.ok) throw new Error(`result_summary ${res.status}`);
    const js = await res.json();
    const items: any[] = js?.result_summary ?? [];

    let summaries = 0, details = 0;
    for (const it of items) {
      const matchId = Number(it?.id ?? it?.match_id);
      if (!matchId) continue;

      await supabase
        .from("integration_playcricket_matches_raw")
        .upsert({ club_id: clubId, match_id: matchId, result_summary: it, fetched_at: new Date().toISOString() }, { onConflict: "club_id,match_id" });
      summaries++;

      // Fetch detail per match
      const dUrl = new URL(`${BASE}/match_detail.json`);
      dUrl.searchParams.set("match_id", String(matchId));
      dUrl.searchParams.set("api_token", token);
      const det = await fetch(dUrl.toString());
      if (det.ok) {
        const match_detail = await det.json();
        await supabase
          .from("integration_playcricket_matches_raw")
          .update({ match_detail, fetched_at: new Date().toISOString() })
          .eq("club_id", clubId)
          .eq("match_id", matchId);
        details++;
      }
      await delay(300); // be polite
    }

    const cursorNow = formatEntryDate(new Date());
    await supabase
      .from("integration_playcricket_settings")
      .update({ last_entry_cursor: cursorNow, last_synced_at: new Date().toISOString() })
      .eq("club_id", clubId);

    return json({ ok: true, season: seasonStr, items: items.length, summaries_upserted: summaries, details_fetched: details });
  } catch (e) {
    console.error("[playcricket-sync]", e);
    return json({ error: String(e?.message || e) }, 500);
  }
});

/* helpers */
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "content-type": "application/json" } });
}
function createServiceClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SERVICE_ROLE_KEY")!;
  return createClient(url, key, { auth: { persistSession: false } });
}
function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
function pad(n: number) { return String(n).padStart(2, "0"); }
function formatEntryDate(d: Date) { return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; }
