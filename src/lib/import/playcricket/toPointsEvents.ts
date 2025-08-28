import type { PcMatchDetail, PcMatch } from "./types";

/** Your canonical PointsEvent shape used by engine/recompute */
export type PointsEvent = {
  matchId: number;
  playerKey: string; // your UUID if known, else "pc:{player_id}" or name key
  category: "batting" | "bowling" | "fielding" | "penalty";
  event: string;
  value: number;
  meta?: Record<string, any>;
};

/** inject your own resolve function to map PC player → our player UUID */
export type PlayerResolver = (pc: {
  playerId?: string | number | null;
  name: string;
}) => { playerKey: string } | null;

const n = (v: any) => (v === "" || v == null ? 0 : Number(v));

/** Overs string like "9.5" → balls (9*6 + 5) = 59 */
export function oversToBalls(overs?: string): number {
  if (!overs) return 0;
  const [o, r] = String(overs).split(".");
  const whole = Number(o) || 0;
  const ballsPart = Number(r) || 0;
  return whole * 6 + ballsPart;
}

function playerKeyFrom(name: string, id?: string | number | null) {
  return id != null ? `pc:${id}` : `name:${name.trim().toLowerCase()}`;
}

/** Core: flatten a PC match_detail payload to PointsEvents */
export function toPointsEvents(
  raw: PcMatchDetail,
  resolve: PlayerResolver = ({ playerId, name }) => ({ playerKey: playerKeyFrom(name, playerId) })
): { events: PointsEvent[]; matchId: number } {
  const md: PcMatch | undefined = raw.match_details?.[0];
  if (!md) throw new Error("No match_details");

  const matchId = Number(md.match_id);
  const evs: PointsEvent[] = [];

  // batting + fielding via innings.bat
  for (const inn of md.innings ?? []) {
    for (const b of inn.bat ?? []) {
      const who = resolve({ playerId: b.batsman_id ?? null, name: b.batsman_name });
      if (!who) continue;

      const runs = n(b.runs);
      const balls = n(b.balls);
      const fours = n(b.fours);
      const sixes = n(b.sixes);
      const outCode = (b.how_out || "").toLowerCase(); // "no" == not out

      if (runs) evs.push({ matchId, playerKey: who.playerKey, category: "batting", event: "runs", value: runs, meta: { balls } });
      if (fours) evs.push({ matchId, playerKey: who.playerKey, category: "batting", event: "fours", value: fours });
      if (sixes) evs.push({ matchId, playerKey: who.playerKey, category: "batting", event: "sixes", value: sixes });

      // Milestones
      if (runs >= 100) evs.push({ matchId, playerKey: who.playerKey, category: "batting", event: "hundred", value: 1 });
      else if (runs >= 50) evs.push({ matchId, playerKey: who.playerKey, category: "batting", event: "fifty", value: 1 });

      // Duck penalty (only if out and runs = 0)
      if (runs === 0 && outCode !== "no") {
        evs.push({ matchId, playerKey: who.playerKey, category: "penalty", event: "duck", value: 1 });
      }

      // Fielding: infer catches/stumpings/runouts from batter dismissal + fielder
      const fielderName = b.fielder_name?.trim();
      const fielderId = b.fielder_id ?? null;

      const addFielding = (event: "catch" | "stumping" | "runout") => {
        if (!fielderName) return;
        const f = resolve({ playerId: fielderId, name: fielderName });
        if (!f) return;
        evs.push({ matchId, playerKey: f.playerKey, category: "fielding", event, value: 1, meta: { victim: b.batsman_name } });
      };

      if (outCode.startsWith("ct")) addFielding("catch");
      if (outCode === "st") addFielding("stumping");
      if (outCode === "ro") addFielding("runout");
    }

    // bowling via innings.bowl
    for (const bw of inn.bowl ?? []) {
      const who = resolve({ playerId: bw.bowler_id ?? null, name: bw.bowler_name });
      if (!who) continue;
      const wickets = n(bw.wickets);
      const maidens = n(bw.maidens);
      const oversBalls = oversToBalls(bw.overs);
      const runsConceded = n(bw.runs);

      if (wickets) evs.push({ matchId, playerKey: who.playerKey, category: "bowling", event: "wickets", value: wickets });
      if (maidens) evs.push({ matchId, playerKey: who.playerKey, category: "bowling", event: "maidens", value: maidens });
      // economy/overs meta if your engine uses it
      evs.push({
        matchId,
        playerKey: who.playerKey,
        category: "bowling",
        event: "spell",
        value: oversBalls, // encode balls as value; use meta for runs
        meta: { overs: bw.overs, balls: oversBalls, runs: runsConceded }
      });

      // 3-for / 5-for
      if (wickets >= 5) evs.push({ matchId, playerKey: who.playerKey, category: "bowling", event: "fivefor", value: 1 });
      else if (wickets >= 3) evs.push({ matchId, playerKey: who.playerKey, category: "bowling", event: "threefor", value: 1 });
    }
  }

  return { events: evs, matchId };
}
