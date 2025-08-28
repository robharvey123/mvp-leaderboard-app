import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Player = { id: string; full_name: string };

export default function NameMapModal({
  open,
  clubId,
  unmatched,
  onClose,
  onSaved,
}: {
  open: boolean;
  clubId: string;
  unmatched: string[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [map, setMap] = useState<Record<string, string>>({});
  const canSave = useMemo(
    () => unmatched.length > 0 && unmatched.every(n => map[n] && map[n] !== "__ignore__"),
    [unmatched, map]
  );

  useEffect(() => {
    if (!open || !clubId) return;
    (async () => {
      const { data } = await supabase
        .from("players")
        .select("id, full_name")
        .eq("club_id", clubId)
        .order("full_name");
      setPlayers((data ?? []) as Player[]);
    })();
  }, [open, clubId]);

  async function save() {
    const rows = Object.entries(map).map(([alias_text, canonical_player_id]) => ({
      club_id: clubId,
      alias_text,
      canonical_player_id,
    }));
    if (!rows.length) return;
    // upsert by (club_id, alias_text)
    const { error } = await supabase.from("player_name_aliases").upsert(rows, {
      onConflict: "club_id,alias_text",
    });
    if (error) { alert(error.message); return; }
    await onSaved();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
      <div className="bg-white rounded-2xl w-[520px] max-w-[90vw] p-4">
        <h2 className="text-lg font-semibold mb-2">Match player names</h2>
        <p className="text-sm text-neutral-600 mb-3">
          Map names from the PDF to your club players. We’ll remember these for future imports.
        </p>

        <div className="max-h-[50vh] overflow-auto space-y-3">
          {unmatched.map((name) => (
            <div key={name} className="flex items-center gap-3">
              <div className="w-1/2 truncate" title={name}>
                <span className="text-sm">{name}</span>
              </div>
              <select
                className="w-1/2 rounded border px-2 py-1"
                value={map[name] ?? ""}
                onChange={(e) => setMap((m) => ({ ...m, [name]: e.target.value }))}
              >
                <option value="">Select player…</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="px-3 py-1.5 rounded border" onClick={onClose}>Cancel</button>
          <button
            className={`px-3 py-1.5 rounded ${canSave ? "bg-black text-white" : "bg-neutral-300 text-neutral-700"}`}
            disabled={!canSave}
            onClick={save}
          >
            Save & Re-ingest
          </button>
        </div>
      </div>
    </div>
  );
}
