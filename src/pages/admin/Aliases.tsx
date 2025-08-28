import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Unresolved = {
  team_id: string;
  name: string;
  role: "bat" | "bowl";
  occurrences: number;
  last_seen_at: string;
};

type Player = { id: string; name: string };

export default function Aliases() {
  const teamId = (import.meta.env.VITE_TEAM_ID || "").trim();
  const [items, setItems] = useState<Unresolved[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const keyed = useMemo(() => (u: Unresolved) => `${u.role}:${u.name.toLowerCase()}`, []);

  useEffect(() => {
    (async () => {
      try {
        setBusy(true);
        setErr(null);
        setOk(null);

        // unresolved for this team
        const q1 = await supabase
          .from("v_unresolved_names_by_team")
          .select("*")
          .eq("team_id", teamId)
          .order("last_seen_at", { ascending: false });
        if (q1.error) throw q1.error;
        setItems((q1.data ?? []) as Unresolved[]);

        // team players
        const q2 = await supabase
          .from("players")
          .select("id, name")
          .eq("team_id", teamId)
          .order("name");
        if (q2.error) throw q2.error;
        setPlayers((q2.data ?? []) as Player[]);
      } catch (e: any) {
        setErr(e?.message || String(e));
      } finally {
        setBusy(false);
      }
    })();
  }, [teamId]);

  const saveAliases = async () => {
    try {
      setBusy(true);
      setErr(null);
      setOk(null);
      const rows = Object.entries(selected)
        .map(([key, player_id]) => {
          const found = items.find(u => keyed(u) === key);
          if (!found) return null;
          return {
            team_id: found.team_id,
            player_id,
            alias: found.name,
          };
        })
        .filter(Boolean) as Array<{ team_id: string; player_id: string; alias: string }>;

      if (!rows.length) {
        setOk("Nothing to save.");
        return;
      }

      const { error } = await supabase.from("player_aliases").upsert(rows);
      if (error) throw error;

      // remove resolved names from unresolved table for this team
      const names = rows.map(r => r.alias);
      const { error: delErr } = await supabase
        .from("import_unresolved_names")
        .delete()
        .eq("team_id", teamId)
        .in("name", names);
      if (delErr) throw delErr;

      setOk("Aliases saved and unresolved cleared. Re-import the same PDFs to backfill cards.");
      // refresh list
      const refreshed = await supabase
        .from("v_unresolved_names_by_team")
        .select("*")
        .eq("team_id", teamId)
        .order("last_seen_at", { ascending: false });
      if (!refreshed.error) setItems((refreshed.data ?? []) as Unresolved[]);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Resolve Player Aliases</h1>
      <p className="text-sm text-slate-600">Team: <code>{teamId || "—"}</code></p>
      {busy && <div>Loading…</div>}
      {err && <div className="text-red-700">Error: {err}</div>}
      {ok && <div className="text-green-700">{ok}</div>}

      <div className="overflow-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-2 text-left">Name (role)</th>
              <th className="p-2 text-left">Last seen</th>
              <th className="p-2 text-left">Map to player</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => {
              const key = keyed(u);
              return (
                <tr key={key} className="border-t">
                  <td className="p-2">{u.name} <span className="text-xs text-slate-500">({u.role})</span></td>
                  <td className="p-2">{new Date(u.last_seen_at).toLocaleString()}</td>
                  <td className="p-2">
                    <select
                      className="border rounded px-2 py-1"
                      value={selected[key] || ""}
                      onChange={(e) =>
                        setSelected((s) => ({ ...s, [key]: e.target.value }))
                      }
                    >
                      <option value="">— Choose player —</option>
                      {players.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
            {!items.length && !busy && (
              <tr><td className="p-2" colSpan={3}>No unresolved names 🎉</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <button
          onClick={saveAliases}
          disabled={busy}
          className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
        >
          Save aliases
        </button>
      </div>
    </div>
  );
}
