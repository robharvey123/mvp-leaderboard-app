import type { PcMatchDetail } from "./types";
import { toPointsEvents } from "./toPointsEvents";
// If your engine exposes e.g. addEvents + recomputeMatch, import here:
import { addPointsEvents, recomputeMatch } from "@/lib/scoring/recompute"; // adjust to your real exports

export async function fetchPcMatchDetail(matchId: number, token: string): Promise<PcMatchDetail> {
  const url = new URL("https://play-cricket.com/api/v2/match_detail.json");
  url.searchParams.set("match_id", String(matchId));
  url.searchParams.set("api_token", token);
  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Play-Cricket error ${res.status}`);
  return res.json();
}

/** Main ingestion entrypoint */
export async function importPlayCricketMatch(matchId: number, token: string) {
  const raw = await fetchPcMatchDetail(matchId, token);

  // Pass a resolver that maps PC IDs to your players table, otherwise it will fall back to name keys.
  const { events } = toPointsEvents(raw, ({ playerId, name }) => {
    // TODO: look up your player by pc_id in DB, else by name:
    const found = window.__playerIndex?.byPcId?.[String(playerId)] // example cache/hook
             || window.__playerIndex?.byName?.[name.trim().toLowerCase()];
    if (!found) return { playerKey: `pc:${playerId ?? name}` };
    return { playerKey: found.id }; // your UUID
  });

  // 1) Persist events (idempotent by matchId+player+event+meta hash, if you have one)
  await addPointsEvents(matchId, events);

  // 2) Trigger your normal recompute using engine.ts config
  await recomputeMatch(matchId);

  return { added: events.length };
}
