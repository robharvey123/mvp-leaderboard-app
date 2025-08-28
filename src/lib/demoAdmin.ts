// src/pages/DemoDashboard.tsx
import { useEffect, useState } from "react";
import { FEATURES } from "@/config/features";
import { seedDemoSeason } from "@/lib/demoSeed";
import { exportDemoJson, resetDemoData } from "@/lib/demoAdmin";
import { demoPlayers } from "@/lib/demoStore";
import { demoMatches, demoPerfs } from "@/lib/demoMatchesStore";
import { Link } from "react-router-dom";

export default function DemoDashboard() {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [count, setCount] = useState<number>(10);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const [stats, setStats] = useState<{ players: number; matches: number; perfs: number }>({
    players: 0,
    matches: 0,
    perfs: 0,
  });

  const isDemo = FEATURES.backend === "demo";

  async function refreshStats() {
    const [p, m, pf] = await Promise.all([
      demoPlayers.list(),
      demoMatches.list(),
      demoPerfs.list(),
    ]);
    setStats({ players: p.length, matches: m.length, perfs: pf.length });
  }

  useEffect(() => {
    refreshStats();
  }, []);

  async function runSeed() {
    setBusy(true);
    setMsg("");
    try {
      const res = await seedDemoSeason({ seasonYear: year, matches: count });
      setMsg(
        `Seeded ${res.matchesCreated} matches for ${res.seasonYear} • Players: ${res.players}.`
      );
      await refreshStats();
    } catch (e: any) {
      setMsg(e?.message || "Seed failed");
    } finally {
      setBusy(false);
    }
  }

  async function onExport() {
    setBusy(true);
    try {
      await exportDemoJson();
    } finally {
      setBusy(false);
    }
  }

  async function onReset() {
    if (!confirm("Reset ALL demo data? This cannot be undone.")) return;
    setBusy(true);
    setMsg("");
    try {
      await resetDemoData();
      await refreshStats();
      setMsg("Demo data reset.");
    } catch (e: any) {
      setMsg(e?.message || "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Demo Tools</h1>
        <p className="text-sm text-gray-600">Generate, export, and reset demo data.</p>
      </header>

      {/* Summary */}
      <div className="rounded-md border bg-white p-3 text-xs text-gray-700 flex flex-wrap gap-4">
        <span><b>Backend:</b> {FEATURES.backend}</span>
        <span><b>Players:</b> {stats.players}</span>
        <span><b>Matches:</b> {stats.matches}</span>
        <span><b>Performances:</b> {stats.perfs}</span>
      </div>

      {/* Seeder */}
      <section className="rounded-2xl p-4 shadow bg-white space-y-4">
        <h2 className="font-semibold">Seed demo season</h2>
        <div className="grid gap-3 md:grid-cols-4 items-end">
          <label className="text-sm">
            <div className="text-gray-600">Season year</div>
            <input
              type="number"
              className="border rounded px-3 py-2 w-full"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </label>

          <label className="text-sm">
            <div className="text-gray-600"># Matches</div>
            <input
              type="number"
              className="border rounded px-3 py-2 w-full"
              value={count}
              min={1}
              max={40}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </label>

          <div className="md:col-span-2">
            <button
              className="px-4 py-2 rounded text-white bg-black disabled:opacity-60"
              onClick={runSeed}
              disabled={!isDemo || busy}
              title={isDemo ? "" : "Switch FEATURES.backend to 'demo' to enable seeding"}
            >
              {busy ? "Seeding…" : "Seed data"}
            </button>
            {!isDemo && <span className="ml-3 text-sm text-gray-600">(Disabled in Supabase mode)</span>}
          </div>
        </div>

        {msg && <div className="text-sm text-gray-800 border rounded p-2 bg-gray-50">{msg}</div>}
      </section>

      {/* Export / Reset */}
      <section className="rounded-2xl p-4 shadow bg-white space-y-3">
        <h2 className="font-semibold">Maintenance</h2>
        <div className="flex flex-wrap gap-3">
          <button
            className="px-4 py-2 rounded border"
            onClick={onExport}
            disabled={busy}
            title="Download demo-export.json"
          >
            Export JSON
          </button>
          <button
            className="px-4 py-2 rounded border border-red-400 text-red-700"
            onClick={onReset}
            disabled={busy}
            title="Clear demo:* keys & store state"
          >
            Reset demo data
          </button>
        </div>
      </section>

      {/* Quick links */}
      <section className="rounded-2xl p-4 shadow bg-white">
        <h2 className="font-semibold mb-2">Quick links</h2>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link className="underline text-blue-600" to="/demo/players">Players</Link>
          <Link className="underline text-blue-600" to="/demo/matches">Matches</Link>
          <Link className="underline text-blue-600" to="/demo/leaderboard">Leaderboard</Link>
          <Link className="underline text-blue-600" to="/admin/import">Import</Link>
          <Link className="underline text-blue-600" to="/analytics/charts">Charts</Link>
        </div>
      </section>
    </div>
  );
}
