// src/pages/DemoMatches.tsx
import { useEffect, useMemo, useState } from "react";
import { FEATURES } from "@/config/features";
import { getActiveClubId } from "@/lib/club";
import {
  demoMatches,
  demoPerfs,
  type DemoMatch,
  type DemoPerformance,
} from "@/lib/demoMatchesStore";
import { demoPlayers, type DemoPlayer } from "@/lib/demoStore";

function formatErr(e: any): string {
  if (!e) return "Unknown error";
  if (typeof e === "string") return e;
  const d = (e as any).error ?? e;
  return d?.message || d?.hint || d?.details || (d?.status && String(d.status)) || JSON.stringify(d);
}

export default function DemoMatches() {
  const [matches, setMatches] = useState<DemoMatch[]>([]);
  const [players, setPlayers] = useState<DemoPlayer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [perfs, setPerfs] = useState<DemoPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add/Update match state
  const [date, setDate] = useState<string>("");
  const [opponent, setOpponent] = useState<string>("");

  // Add performance state
  const [perfPlayerId, setPerfPlayerId] = useState<string>("");
  const [runs, setRuns] = useState<number>(0);
  const [wickets, setWickets] = useState<number>(0);
  const [overs, setOvers] = useState<number>(0);

  const backend = FEATURES.backend;
  const clubId = getActiveClubId() || "—";

  const selectedMatch = useMemo(
    () => matches.find((m) => m.id === selectedId) || null,
    [matches, selectedId]
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [ms, pls] = await Promise.all([demoMatches.list(), demoPlayers.list()]);
        setMatches(ms);
        setPlayers(pls);
        // auto-select the last match by date desc
        if (ms.length > 0) setSelectedId(ms[ms.length - 1].id);
      } catch (e) {
        console.error("init load failed", e);
        setError(formatErr(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!selectedId) {
        setPerfs([]);
        return;
      }
      setError(null);
      try {
        const rows = await demoPerfs.list(selectedId);
        setPerfs(rows);
      } catch (e) {
        console.error("load perfs failed", e);
        setError(formatErr(e));
      }
    })();
  }, [selectedId]);

  async function addMatch() {
    if (!date) return alert("Pick a date");
    setSaving(true);
    setError(null);
    try {
      const m = await demoMatches.create({ date, opponent });
      const ms = await demoMatches.list();
      setMatches(ms);
      setSelectedId(m.id);
      setDate("");
      setOpponent("");
    } catch (e) {
      console.error("add match failed", e);
      setError(formatErr(e));
    } finally {
      setSaving(false);
    }
  }

  async function deleteMatch(id: string) {
    if (!confirm("Delete this match (and its performances)?")) return;
    setSaving(true);
    setError(null);
    try {
      await demoMatches.remove(id);
      const ms = await demoMatches.list();
      setMatches(ms);
      setSelectedId(ms.length ? ms[ms.length - 1].id : null);
      setPerfs([]);
    } catch (e) {
      console.error("delete match failed", e);
      setError(formatErr(e));
    } finally {
      setSaving(false);
    }
  }

  async function addPerf() {
    if (!selectedId) return alert("Select a match first");
    if (!perfPlayerId) return alert("Pick a player");
    setSaving(true);
    setError(null);
    try {
      await demoPerfs.add({
        matchId: selectedId,
        playerId: perfPlayerId,
        runs: Number(runs) || 0,
        wickets: Number(wickets) || 0,
        overs: Number(overs) || 0,
        fours: 0,
        sixes: 0,
        maidens: 0,
        runs_conceded: 0,
        catches: 0,
        stumpings: 0,
        runouts: 0,
      });
      const rows = await demoPerfs.list(selectedId);
      setPerfs(rows);
      setPerfPlayerId("");
      setRuns(0);
      setWickets(0);
      setOvers(0);
    } catch (e) {
      console.error("add perf failed", e);
      setError(formatErr(e));
    } finally {
      setSaving(false);
    }
  }

  async function deletePerf(id: string) {
    setSaving(true);
    setError(null);
    try {
      await demoPerfs.remove(id);
      const rows = await demoPerfs.list(selectedId || undefined);
      setPerfs(rows);
    } catch (e) {
      console.error("delete perf failed", e);
      setError(formatErr(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Status */}
      <div className="rounded-md border bg-white p-3 text-xs text-gray-700 flex flex-wrap gap-3">
        <span><b>Backend:</b> {backend}</span>
        <span><b>Club:</b> {clubId}</span>
      </div>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Demo Matches</h1>
          <p className="text-sm text-gray-600">Create matches and add quick batting/bowling entries.</p>
        </div>
      </header>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          <div className="font-semibold mb-1">Error</div>
          <div className="whitespace-pre-wrap break-words">{error}</div>
        </div>
      )}

      {/* Create match */}
      <section className="rounded-2xl p-4 shadow bg-white">
        <h2 className="font-semibold mb-3">Add Match</h2>
        <div className="grid gap-3 md:grid-cols-4 items-end">
          <Field label="Date">
            <input type="date" className="w-full border rounded px-3 py-2" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Opponent">
            <input type="text" className="w-full border rounded px-3 py-2" value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="e.g., Sevenoaks" />
          </Field>
          <div className="md:col-span-2">
            <button className="px-4 py-2 rounded text-white bg-black disabled:opacity-60" onClick={addMatch} disabled={saving}>
              {saving ? "Saving…" : "Add match"}
            </button>
          </div>
        </div>
      </section>

      {/* Matches list */}
      <section className="rounded-2xl p-4 shadow bg-white">
        <h2 className="font-semibold mb-3">Matches</h2>
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : matches.length === 0 ? (
          <p className="text-sm text-gray-500">No matches yet — create one above.</p>
        ) : (
          <div className="flex gap-4">
            <ul className="w-64 border rounded">
              {matches.map((m) => (
                <li key={m.id} className={`px-3 py-2 border-b last:border-0 cursor-pointer ${selectedId === m.id ? "bg-gray-100" : ""}`} onClick={() => setSelectedId(m.id)}>
                  <div className="font-medium">{m.date || "—"}</div>
                  <div className="text-xs text-gray-600">{m.opponent || "Opponent —"}</div>
                </li>
              ))}
            </ul>
            <div className="flex-1">
              {!selectedMatch ? (
                <p className="text-sm text-gray-500">Select a match.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold">{selectedMatch.date || "—"}</div>
                      <div className="text-sm text-gray-600">vs {selectedMatch.opponent || "—"}</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-2 rounded border" onClick={() => deleteMatch(selectedMatch.id)} disabled={saving}>Delete match</button>
                    </div>
                  </div>

                  {/* Add performance */}
                  <div className="rounded-lg border p-3 mb-4">
                    <h3 className="font-semibold mb-2">Add Performance</h3>
                    <div className="grid gap-3 md:grid-cols-5 items-end">
                      <Field label="Player">
                        <select className="w-full border rounded px-3 py-2" value={perfPlayerId} onChange={(e) => setPerfPlayerId(e.target.value)}>
                          <option value="">— Select player —</option>
                          {players.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                        </select>
                      </Field>
                      <Field label="Runs">
                        <input type="number" className="w-full border rounded px-3 py-2" value={runs} onChange={(e) => setRuns(Number(e.target.value))} />
                      </Field>
                      <Field label="Wkts">
                        <input type="number" className="w-full border rounded px-3 py-2" value={wickets} onChange={(e) => setWickets(Number(e.target.value))} />
                      </Field>
                      <Field label="Overs">
                        <input type="number" step="0.1" className="w-full border rounded px-3 py-2" value={overs} onChange={(e) => setOvers(Number(e.target.value))} />
                      </Field>
                      <div>
                        <button className="px-4 py-2 rounded text-white bg-black disabled:opacity-60" onClick={addPerf} disabled={saving || !perfPlayerId}>
                          {saving ? "Saving…" : "Add"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Performances table */}
                  <div className="overflow-x-auto">
                    {perfs.length === 0 ? (
                      <p className="text-sm text-gray-500">No performances yet.</p>
                    ) : (
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500">
                            <th className="py-2 pr-4">Player</th>
                            <th className="py-2 pr-4">Runs</th>
                            <th className="py-2 pr-4">Wkts</th>
                            <th className="py-2 pr-4">Overs</th>
                            <th className="py-2 pr-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {perfs.map((p) => {
                            const pl = players.find((x) => x.id === p.playerId);
                            return (
                              <tr key={p.id} className="border-t">
                                <td className="py-2 pr-4">{pl?.name || p.playerId}</td>
                                <td className="py-2 pr-4">{p.runs ?? 0}</td>
                                <td className="py-2 pr-4">{p.wickets ?? 0}</td>
                                <td className="py-2 pr-4">{p.overs ?? 0}</td>
                                <td className="py-2 pr-4">
                                  <button className="px-2 py-1 border rounded" onClick={() => deletePerf(p.id)} disabled={saving}>
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-gray-600">{label}</label>
      {children}
    </div>
  );
}
