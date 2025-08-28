// src/pages/DemoDashboard.tsx
import { useState } from "react";
import { FEATURES } from "@/config/features";
import { seedDemoSeason } from "@/lib/demoSeed";
import { Link } from "react-router-dom";

export default function DemoDashboard() {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [count, setCount] = useState<number>(10);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const isDemo = FEATURES.backend === "demo";

  async function runSeed() {
    setBusy(true);
    setMsg("");
    try {
      const res = await seedDemoSeason({ seasonYear: year, matches: count });
      setMsg(
        `Seeded ${res.matchesCreated} matches for ${res.seasonYear} • Players: ${res.players}. ` +
        `Open Demo → Matches / Leaderboard to view.`
      );
    } catch (e: any) {
      setMsg(e?.message || "Seed failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Demo Tools</h1>
        <p className="text-sm text-gray-600">
          Generate demo data and jump to the key pages.
        </p>
      </header>

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
            {!isDemo && (
              <span className="ml-3 text-sm text-gray-600">
                (Disabled in Supabase mode)
              </span>
            )}
          </div>
        </div>

        {msg && (
          <div className="text-sm text-gray-800 border rounded p-2 bg-gray-50">{msg}</div>
        )}
      </section>

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
