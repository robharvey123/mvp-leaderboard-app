import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function PlayCricketIntegration() {
  const [form, setForm] = useState({ site_id: "", api_token: "", default_season: "" });
  const [clubId, setClubId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    (async () => {
      // TODO: fetch org/clubId from your OrgContext
      const { data: me } = await supabase.auth.getUser();
      setClubId(localStorage.getItem("clubId") || "YOUR-CLUB-ID"); // replace with real club id
      // load settings if present
      const { data } = await supabase
        .from("integration_playcricket_settings")
        .select("site_id, default_season, last_synced_at")
        .eq("club_id", localStorage.getItem("clubId"))
        .maybeSingle();
      if (data?.site_id) setForm((f) => ({ ...f, site_id: String(data.site_id), default_season: data.default_season || "" }));
    })();
  }, []);

  const save = async () => {
    setBusy(true);
    setStatus("");
    try {
      const { error } = await supabase
        .from("integration_playcricket_settings")
        .upsert({
          club_id: clubId,
          site_id: Number(form.site_id),
          api_token: form.api_token,
          default_season: form.default_season || new Date().getFullYear().toString(),
        }, { onConflict: "club_id" });
      if (error) throw error;
      setStatus("Saved.");
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const syncNow = async (full?: boolean) => {
    setBusy(true);
    setStatus("Syncing…");
    try {
      const res = await fetch("/functions/v1/playcricket-sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clubId,
          season: form.default_season || new Date().getFullYear().toString(),
          fullResync: !!full,
        }),
      });
      const json = await res.json();
      setStatus(res.ok ? `Synced: ${json.items} items (${json.details_fetched} details)` : `Error: ${json.error || res.status}`);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Play-Cricket Integration</h1>

      <div className="grid gap-3">
        <label className="block">
          <div className="text-sm text-gray-600 mb-1">Site ID</div>
          <input className="w-full border rounded px-3 py-2" placeholder="e.g. 12345"
            value={form.site_id} onChange={(e) => setForm({ ...form, site_id: e.target.value })}/>
        </label>
        <label className="block">
          <div className="text-sm text-gray-600 mb-1">API token</div>
          <input className="w-full border rounded px-3 py-2" placeholder="paste your club token"
            value={form.api_token} onChange={(e) => setForm({ ...form, api_token: e.target.value })}/>
          <p className="text-xs text-gray-500 mt-1">Stored server-side; never exposed to other clubs.</p>
        </label>
        <label className="block">
          <div className="text-sm text-gray-600 mb-1">Default season</div>
          <input className="w-full border rounded px-3 py-2" placeholder="2025"
            value={form.default_season} onChange={(e) => setForm({ ...form, default_season: e.target.value })}/>
        </label>

        <div className="flex gap-3">
          <button disabled={busy} onClick={save} className="rounded border px-4 py-2">Save</button>
          <button disabled={busy} onClick={() => syncNow(false)} className="rounded bg-blue-600 text-white px-4 py-2">Sync now</button>
          <button disabled={busy} onClick={() => syncNow(true)} className="rounded border px-4 py-2">Full resync</button>
        </div>
        <div className="text-sm text-gray-600">{status}</div>
      </div>
    </div>
  );
}
