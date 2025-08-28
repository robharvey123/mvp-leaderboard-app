import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const FIELDS = [
  "batting_run",
  "fifty_bonus",
  "hundred_bonus",
  "wicket",
  "maiden",
  "catch",
  "stumping",
  "runout",
  "assist",
  "duck_penalty",
  "drop_penalty",
] as const;

export default function PointsSettings() {
  const [cfg, setCfg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("points_config")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1);
      if (data?.length) setCfg(data[0]);
      else
        setCfg({
          batting_run: 1,
          fifty_bonus: 10,
          hundred_bonus: 20,
          wicket: 20,
          maiden: 4,
          catch: 5,
          stumping: 7,
          runout: 6,
          assist: 3,
          duck_penalty: 5,
          drop_penalty: 2,
        });
      setLoading(false);
    })();
  }, []);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("points_config").insert({ ...cfg });
    setSaving(false);
    if (error) alert(error.message);
    else alert("Saved! New config will be used for future imports.");
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Points Settings</h1>
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map((key) => (
          <label key={key} className="text-sm space-y-1">
            <span className="block capitalize">{key.replace(/_/g, " ")}</span>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              value={cfg[key] ?? 0}
              onChange={(e) => setCfg((c: any) => ({ ...c, [key]: Number(e.target.value) }))}
            />
          </label>
        ))}
      </div>
      <button onClick={save} className="bg-blue-600 text-white px-4 py-2 rounded" disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
