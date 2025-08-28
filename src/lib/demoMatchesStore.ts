// src/lib/demoMatchesStore.ts
import { FEATURES } from "@/config/features";
import { getActiveClubId } from "@/lib/club";

// Supabase adapters
import { supabaseMatches, type RemoteMatch } from "@/lib/adapters/supabaseMatches";
import { supabasePerfs,  type RemotePerformance } from "@/lib/adapters/supabasePerfs";

// ===== Types used by UI =====
export type DemoMatch = {
  id: string;
  date: string;            // YYYY-MM-DD
  opponent?: string;
};

export type DemoPerformance = {
  id: string;
  matchId: string;
  playerId: string;
  runs?: number;
  fours?: number;
  sixes?: number;
  overs?: number;
  maidens?: number;
  runs_conceded?: number;
  wickets?: number;
  catches?: number;
  stumpings?: number;
  runouts?: number;
};

// ===== In-memory + localStorage (demo backend) =====
const LS_MATCHES = "demo:matches";
const LS_PERFS   = "demo:perfs";

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save<T>(key: string, val: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(val));
}
function uid() {
  // local uuid-ish for demo mode
  return "d_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(4);
}

// ===== Public API =====
export const demoMatches = {
  async list(): Promise<DemoMatch[]> {
    if (FEATURES.backend === "supabase") {
      const rows: RemoteMatch[] = await supabaseMatches.list();
      return rows.map((m) => ({
        id: m.id,
        date: (m.date ?? "").toString(),
        opponent: m.opponent ?? undefined,
      }));
    }
    const arr = load<DemoMatch[]>(LS_MATCHES, []);
    return arr.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  },

  async create(input: { date?: string; opponent?: string }): Promise<DemoMatch> {
    if (FEATURES.backend === "supabase") {
      const m = await supabaseMatches.create({ date: input.date, opponent: input.opponent });
      return { id: m.id, date: (m.date ?? "").toString(), opponent: m.opponent ?? undefined };
    }
    const now: DemoMatch = { id: uid(), date: input.date || new Date().toISOString().slice(0, 10), opponent: input.opponent || undefined };
    const all = await this.list();
    const next = [...all, now];
    save(LS_MATCHES, next);
    return now;
  },

  async update(id: string, patch: Partial<{ date?: string; opponent?: string }>): Promise<DemoMatch> {
    if (FEATURES.backend === "supabase") {
      const m = await supabaseMatches.update(id, { date: patch.date, opponent: patch.opponent });
      return { id: m.id, date: (m.date ?? "").toString(), opponent: m.opponent ?? undefined };
    }
    const all = await this.list();
    const idx = all.findIndex((x) => x.id === id);
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...patch };
      save(LS_MATCHES, all);
      return all[idx];
    }
    throw new Error("Match not found");
  },

  async remove(id: string): Promise<void> {
    if (FEATURES.backend === "supabase") {
      await supabaseMatches.remove(id);
      return;
    }
    const all = await this.list();
    save(LS_MATCHES, all.filter((x) => x.id !== id));
    // also clear its perfs
    const perfs = load<DemoPerformance[]>(LS_PERFS, []);
    save(LS_PERFS, perfs.filter((p) => p.matchId !== id));
  },

  async clearAll(): Promise<void> {
    if (FEATURES.backend === "supabase") {
      // dev-only: delete all matches for active club
      const ms = await supabaseMatches.list();
      await Promise.all(ms.map((m) => supabaseMatches.remove(m.id)));
      return;
    }
    save(LS_MATCHES, []);
    save(LS_PERFS, []);
  },
};

export const demoPerfs = {
  async list(matchId?: string): Promise<DemoPerformance[]> {
    if (FEATURES.backend === "supabase") {
      const rows: RemotePerformance[] = await supabasePerfs.list(matchId);
      return rows.map((r) => ({
        id: r.id,
        matchId: r.match_id,
        playerId: r.player_id,
        runs: r.runs ?? 0,
        fours: r.fours ?? 0,
        sixes: r.sixes ?? 0,
        overs: r.overs ?? 0,
        maidens: r.maidens ?? 0,
        runs_conceded: r.runs_conceded ?? 0,
        wickets: r.wickets ?? 0,
        catches: r.catches ?? 0,
        stumpings: r.stumpings ?? 0,
        runouts: r.runouts ?? 0,
      }));
    }
    const perfs = load<DemoPerformance[]>(LS_PERFS, []);
    return matchId ? perfs.filter((p) => p.matchId === matchId) : perfs;
  },

  async add(input: Omit<DemoPerformance, "id">): Promise<DemoPerformance> {
    if (FEATURES.backend === "supabase") {
      const row = await supabasePerfs.add({
        match_id: input.matchId,
        player_id: input.playerId,
        runs: input.runs ?? 0,
        fours: input.fours ?? 0,
        sixes: input.sixes ?? 0,
        overs: input.overs ?? 0,
        maidens: input.maidens ?? 0,
        runs_conceded: input.runs_conceded ?? 0,
        wickets: input.wickets ?? 0,
        catches: input.catches ?? 0,
        stumpings: input.stumpings ?? 0,
        runouts: input.runouts ?? 0,
      });
      return {
        id: row.id,
        matchId: row.match_id,
        playerId: row.player_id,
        runs: row.runs ?? 0,
        fours: row.fours ?? 0,
        sixes: row.sixes ?? 0,
        overs: row.overs ?? 0,
        maidens: row.maidens ?? 0,
        runs_conceded: row.runs_conceded ?? 0,
        wickets: row.wickets ?? 0,
        catches: row.catches ?? 0,
        stumpings: row.stumpings ?? 0,
        runouts: row.runouts ?? 0,
      };
    }
    const now: DemoPerformance = { id: uid(), ...input };
    const perfs = load<DemoPerformance[]>(LS_PERFS, []);
    save(LS_PERFS, [...perfs, now]);
    return now;
  },

  async remove(id: string): Promise<void> {
    if (FEATURES.backend === "supabase") {
      await supabasePerfs.remove(id);
      return;
    }
    const perfs = load<DemoPerformance[]>(LS_PERFS, []);
    save(LS_PERFS, perfs.filter((p) => p.id !== id));
  },
};
