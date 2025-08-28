import { useState } from "react";
import useContextIds from "@/hooks/useContextIds";
import useSeasonBounds from "@/hooks/useSeasonBounds";
import { recomputeSeasonPoints } from "@/lib/scoring/recompute";

export default function RecomputePage() {
  const { clubId, seasonId } = useContextIds();
  const { start, end, loading: loadingBounds } = useSeasonBounds(seasonId);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const canRun = !!clubId && !!seasonId && !!start && !!end;

  async function run() {
    if (!canRun) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await recomputeSeasonPoints({
        clubId,
        seasonId,
        start: start!, // ISO yyyy-mm-dd from hook
        end: end!,
      });
      setMsg(`Recomputed ${res.matches} matches. Inserted ${res.eventsInserted} events.`);
    } catch (e: any) {
      setMsg(`Error: ${e.message || e.toString()}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 space-y-3">
      <h1 className="text-2xl font-bold">Recompute Points</h1>
      <p className="text-sm text-neutral-600">
        Club: <code>{clubId || "-"}</code> &nbsp; Season: <code>{seasonId || "-"}</code>
      </p>
      <p className="text-sm text-neutral-600">
        Range: <code>{start || "?"}</code> → <code>{end || "?"}</code> {loadingBounds && "(loading season…)"}
      </p>

      <button
        onClick={run}
        disabled={!canRun || busy}
        className={`px-4 py-2 rounded ${busy || !canRun ? "bg-neutral-300" : "bg-black text-white"}`}
      >
        {busy ? "Recomputing…" : "Recompute now"}
      </button>

      {msg && <p className="text-sm">{msg}</p>}

      {!canRun && (
        <p className="text-xs text-red-600">
          Select a Club and Season in the context bar first.
        </p>
      )}
    </div>
  );
}
