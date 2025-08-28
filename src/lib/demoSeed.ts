// src/lib/demoSeed.ts
import { FEATURES } from "@/config/features";
import { demoPlayers } from "@/lib/demoStore";
import { demoMatches, demoPerfs } from "@/lib/demoMatchesStore";

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]) {
  return arr[randInt(0, arr.length - 1)];
}
function sample<T>(arr: T[], n: number) {
  const a = [...arr];
  const out: T[] = [];
  while (out.length < Math.min(n, a.length)) {
    const i = randInt(0, a.length - 1);
    out.push(a[i]);
    a.splice(i, 1);
  }
  return out;
}
function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

/** Ensure we have some demo players; returns the final roster. */
async function ensurePlayers(): Promise<{ id: string; name: string }[]> {
  const existing = await demoPlayers.list();
  if (existing.length >= 11) return existing;

  const names = [
    "Alex Carter","Ben Hughes","Charlie Dunn","Dan Patel","Ethan Shaw",
    "Finn Morgan","George Webb","Harry Blake","Ishan Rao","Jack O'Neill",
    "Kieran Walsh","Liam Ford","Mikey Reed","Noah Clark","Ollie Grant",
  ];
  // Add up to 12 players total
  const need = Math.max(0, 12 - existing.length);
  for (let i = 0; i < need; i++) {
    const name = pick(names) + ` ${randInt(1, 99)}`;
    await demoPlayers.create({ name });
  }
  return demoPlayers.list();
}

/**
 * Seed a season of demo data.
 * @param seasonYear e.g. 2025
 * @param matches number of matches to create
 */
export async function seedDemoSeason({ seasonYear = 2025, matches = 10 } = {}) {
  if (FEATURES.backend !== "demo") {
    throw new Error("Seeder only runs in demo backend. Switch FEATURES.backend = 'demo'.");
  }

  const roster = await ensurePlayers();

  // dates across May–Aug
  const months = [5, 6, 7, 8];
  const createdMatchIds: string[] = [];

  for (let i = 0; i < matches; i++) {
    const m = months[randInt(0, months.length - 1)];
    const d = randInt(1, 28);
    const date = `${seasonYear}-${pad(m)}-${pad(d)}`;
    const opponent = pick(["Sevenoaks", "Bromley", "Chislehurst", "Dulwich", "Hayes", "Orpington"]);

    // create match
    const match = await demoMatches.create({ date, opponent });
    createdMatchIds.push(match.id);

    // pick XI
    const xi = sample(roster, 11);

    // generate basic performances
    for (const pl of xi) {
      const role = pick(["bat","bat","bat","bat","all","all","all","bowl","bowl","bowl","wk"]);
      const isOpener = Math.random() < 0.18;

      const runs = role === "bowl" ? randInt(0, 25) : isOpener ? randInt(10, 80) : randInt(0, 60);
      const wickets = role === "bat" ? randInt(0, 1) : role === "bowl" ? randInt(0, 5) : randInt(0, 3);
      const overs = role === "bowl" ? randInt(2, 10) : randInt(0, 4);
      const maidens = overs > 4 && Math.random() < 0.25 ? randInt(1, 2) : 0;
      const runsConceded = overs ? Math.max(0, Math.round(overs * randInt(3, 6) + randInt(-3, 6))) : 0;
      const fours = Math.max(0, Math.round(runs / 8) + randInt(-1, 2));
      const sixes = Math.max(0, Math.round(runs / 25) + (Math.random() < 0.1 ? 1 : 0));
      const catches = Math.random() < 0.2 ? 1 : 0;
      const stumpings = role === "wk" && Math.random() < 0.15 ? 1 : 0;
      const runouts = Math.random() < 0.07 ? 1 : 0;

      await demoPerfs.add({
        matchId: match.id,
        playerId: pl.id,
        runs,
        wickets,
        overs,
        maidens,
        runs_conceded: runsConceded,
        fours,
        sixes,
        catches,
        stumpings,
        runouts,
      });
    }
  }

  return {
    seasonYear,
    matchesCreated: createdMatchIds.length,
    players: roster.length,
  };
}
