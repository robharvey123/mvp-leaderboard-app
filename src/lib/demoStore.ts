// src/lib/demoStore.ts
import { FEATURES } from "@/config/features";

// Shared type used by UI
export type DemoPlayer = {
  id: string;
  name: string;
  role?: "Batter" | "All-rounder" | "Bowler" | "Keeper";
  battingStyle?: string;
  bowlingStyle?: string;
};

//
// Local (existing) implementation
//
const KEY = "demo:players";
function uid() {
  // @ts-ignore
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function loadLocal(): DemoPlayer[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seedLocal();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr as DemoPlayer[] : seedLocal();
  } catch {
    return seedLocal();
  }
}
function saveLocal(players: DemoPlayer[]) { localStorage.setItem(KEY, JSON.stringify(players)); }
function seedLocal(): DemoPlayer[] {
  const seeded: DemoPlayer[] = [
    { id: uid(), name: "Alex Cook", role: "Batter", battingStyle: "RHB" },
    { id: uid(), name: "Joe Root", role: "Batter", battingStyle: "RHB" },
    { id: uid(), name: "Ben Stokes", role: "All-rounder", battingStyle: "LHB", bowlingStyle: "RMF" },
    { id: uid(), name: "Sophie Ecclestone", role: "Bowler", bowlingStyle: "SLA" },
    { id: uid(), name: "Amy Jones", role: "Keeper", battingStyle: "RHB" },
  ];
  saveLocal(seeded);
  return seeded;
}
const localPlayers = {
  list(): DemoPlayer[] { return loadLocal(); },
  create(input: Omit<DemoPlayer, "id">): DemoPlayer {
    const players = loadLocal();
    const p: DemoPlayer = { id: uid(), ...input };
    players.push(p); saveLocal(players); return p;
  },
  update(id: string, patch: Partial<Omit<DemoPlayer, "id">>): DemoPlayer | null {
    const players = loadLocal();
    const idx = players.findIndex((p) => p.id === id); if (idx === -1) return null;
    players[idx] = { ...players[idx], ...patch }; saveLocal(players); return players[idx];
  },
  remove(id: string) { const players = loadLocal().filter(p => p.id !== id); saveLocal(players); },
  clearAll() { localStorage.removeItem(KEY); },
};

//
// Supabase-backed implementation (via adapter)
//
import supabasePlayers from "@/lib/adapters/supabasePlayers";;
const remotePlayers = {
  async list(): Promise<DemoPlayer[]> { return await supabasePlayers.list(); },
  async create(input: Omit<DemoPlayer, "id">) { return await supabasePlayers.create(input as any); },
  async update(id: string, patch: Partial<Omit<DemoPlayer, "id">>) { return await supabasePlayers.update(id, patch as any); },
  async remove(id: string) { await supabasePlayers.remove(id); },
  async clearAll() { /* no-op remotely */ },
};

// Export a unified facade the pages already use
export const demoPlayers = FEATURES.backend === 'supabase' ? remotePlayers : localPlayers;
