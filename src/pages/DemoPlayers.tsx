// src/pages/DemoPlayers.tsx
import { useEffect, useState } from "react";
import { demoPlayers, type DemoPlayer } from "@/lib/demoStore";
import { FEATURES } from "@/config/features";
import { SUPABASE_URL, SUPABASE_ANON_KEY, DEFAULT_CLUB_ID } from "@/lib/env";

type Role = "Batter" | "All-rounder" | "Bowler" | "Keeper";

type EditState = {
  id: string;
  name: string;
  role: Role | "";
  battingStyle: string;
  bowlingStyle: string;
} | null;

function formatErr(e: any): string {
  if (!e) return "Unknown error";
  if (typeof e === "string") return e;
  // Supabase/PostgREST error shapes
  const d = (e as any).error ?? e;
  return (
    d?.message ||
    d?.hint ||
    d?.details ||
    (d?.status && String(d.status)) ||
    JSON.stringify(d)
  );
}

export default function DemoPlayers() {
  const [players, setPlayers] = useState<DemoPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add form
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [battingStyle, setBattingStyle] = useState("");
  const [bowlingStyle, setBowlingStyle] = useState("");

  // Edit modal state
  const [editing, setEditing] = useState<EditState>(null);
  const [saving, setSaving] = useState(false);

  const backend = FEATURES.backend;
  const envOk = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
  const activeClubId = localStorage.getItem("org:last") || DEFAULT_CLUB_ID || "";

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await Promise.resolve(demoPlayers.list() as any);
        setPlayers(list);
      } catch (e) {
        console.error("load players failed", e);
        setError(formatErr(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function refresh() {
    try {
      const list = await Promise.resolve(demoPlayers.list() as any);
      setPlayers(list);
    } catch (e) {
      console.error("refresh players failed", e);
      setError(formatErr(e));
    }
  }

  async function addPlayer() {
    if (!name.trim()) return;
    try {
      await Promise.resolve(
        demoPlayers.create({
          name: name.trim(),
          role: (role || undefined) as Role | undefined,
          battingStyle: battingStyle || undefined,
          bowlingStyle: bowlingStyle || undefined,
        }) as any
      );
      setName("");
      setRole("");
      setBattingStyle("");
      setBowlingStyle("");
      await refresh();
    } catch (e) {
      console.error("add player failed", e);
      setError(formatErr(e));
    }
  }

  async function removePlayer(id: string) {
    if (!confirm("Remove player?")) return;
    try {
      await Promise.resolve(demoPlayers.remove(id) as any);
      await refresh();
    } catch (e) {
      console.error("remove player failed", e);
      setError(formatErr(e));
    }
  }

  function startEdit(p: DemoPlayer) {
    setEditing({
      id: p.id,
      name: p.name,
      role: (p.role ?? "") as Role | "",
      battingStyle: p.battingStyle ?? "",
      bowlingStyle: p.bowlingStyle ?? "",
    });
  }

  async function saveEdit() {
    if (!editing) return;
    if (!editing.name.trim()) return alert("Name is required");

    setSaving(true);
    try {
      await Promise.resolve(
        demoPlayers.update(editing.id, {
          name: editing.name.trim(),
          role: (editing.role || undefined) as Role | undefined,
          battingStyle: editing.battingStyle || undefined,
          bowlingStyle: editing.bowlingStyle || undefined,
        }) as any
      );
      setEditing(null);
      await refresh();
    } catch (e) {
      console.error("update player failed", e);
      setError(formatErr(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Status banner */}
      <div className="rounded-md border bg-white p-3 text-xs text-gray-700 flex flex-wrap gap-3">
        <span><b>Backend:</b> {backend}</span>
        <span><b>Env OK:</b> {String(envOk)}</span>
        <span><b>Club:</b> {activeClubId || "—"}</span>
        {backend === "supabase" && !envOk && (
          <span className="text-red-600"><b>Missing</b> VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY</span>
        )}
      </div>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Demo Players</h1>
          <p className="text-sm text-gray-600">
            Local Demo or Supabase (depending on feature flag).
          </p>
        </div>
      </header>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          <div className="font-semibold mb-1">Error</div>
          <div className="whitespace-pre-wrap break-words">{error}</div>
          <div className="mt-2 text-xs text-red-700">
            If backend = <code>supabase</code> a common cause is:
            <ul className="list-disc ml-5">
              <li>Missing <code>VITE_CLUB_ID</code> or no <code>org:last</code> in localStorage.</li>
              <li>RLS: your user isn’t in <code>user_org_roles</code> for that club.</li>
              <li>Table/columns not created yet (run the SQL bootstrap).</li>
            </ul>
          </div>
        </div>
      )}

      {/* Add player */}
      <section className="rounded-2xl p-4 shadow bg-white">
        <h2 className="font-semibold mb-3">Add Player</h2>
        <div className="grid gap-3 md:grid-cols-4 items-end">
          <TextField label="Name" value={name} onChange={setName} placeholder="e.g., Ben Stokes" />
          <SelectRole label="Role" value={role} onChange={setRole} />
          <TextField label="Batting style" value={battingStyle} onChange={setBattingStyle} placeholder="RHB / LHB" />
          <TextField label="Bowling style" value={bowlingStyle} onChange={setBowlingStyle} placeholder="RMF / SLA / Legspin …" />
          <div className="md:col-span-4">
            <button onClick={addPlayer} className="px-4 py-2 rounded text-white bg-black">
              Add Player
            </button>
          </div>
        </div>
      </section>

      {/* Players table */}
      <section className="rounded-2xl p-4 shadow bg-white overflow-x-auto">
        <h2 className="font-semibold mb-3">Players</h2>
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : players.length === 0 ? (
          <p className="text-sm text-gray-500">No players yet — add one above.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Bat</th>
                <th className="py-2 pr-4">Bowl</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="py-2 pr-4">{p.name}</td>
                  <td className="py-2 pr-4">{p.role ?? "—"}</td>
                  <td className="py-2 pr-4">{p.battingStyle ?? "—"}</td>
                  <td className="py-2 pr-4">{p.bowlingStyle ?? "—"}</td>
                  <td className="py-2 pr-4 flex gap-2">
                    <button className="px-2 py-1 border rounded" onClick={() => startEdit(p)}>
                      Edit
                    </button>
                    <button className="px-2 py-1 border rounded" onClick={() => removePlayer(p.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Edit modal */}
      {editing && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(null)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow p-5">
            <h3 className="text-lg font-semibold mb-4">Edit Player</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <TextField label="Name" value={editing.name} onChange={(v) => setEditing((e) => (e ? { ...e, name: v } : e))} />
              <SelectRole label="Role" value={editing.role} onChange={(v) => setEditing((e) => (e ? { ...e, role: v } : e))} />
              <TextField label="Batting style" value={editing.battingStyle} onChange={(v) => setEditing((e) => (e ? { ...e, battingStyle: v } : e))} placeholder="RHB / LHB" />
              <TextField label="Bowling style" value={editing.bowlingStyle} onChange={(v) => setEditing((e) => (e ? { ...e, bowlingStyle: v } : e))} placeholder="RMF / SLA / Legspin …" />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button className="px-3 py-2 rounded border" onClick={() => setEditing(null)} disabled={saving}>
                Cancel
              </button>
              <button className="px-3 py-2 rounded text-white bg-black disabled:opacity-60" onClick={saveEdit} disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs text-gray-600">{label}</label>
      <input
        className="w-full border rounded px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function SelectRole({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Role | "";
  onChange: (v: Role | "") => void;
}) {
  return (
    <div>
      <label className="text-xs text-gray-600">{label}</label>
      <select
        className="w-full border rounded px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value as Role | "")}
      >
        <option value="">—</option>
        <option value="Batter">Batter</option>
        <option value="All-rounder">All-rounder</option>
        <option value="Bowler">Bowler</option>
        <option value="Keeper">Keeper</option>
      </select>
    </div>
  );
}
