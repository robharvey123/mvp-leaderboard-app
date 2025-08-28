// src/pages/ChartsPage.tsx
import { useMemo } from "react";
import * as Charts from "@/components/charts/Primitives";

// (Optional) If you want to wire real demo data later, you can import it like this:
// import { teams, playersByTeam, matchesByTeam, teamStatsByTeam } from "../data/mvpDemoData";

export default function ChartsPage() {
  // Simple, self-contained demo datasets so this page always renders
  const matchByMatch = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => ({
        x: `M${i + 1}`,
        y: Math.round(20 + Math.random() * 60),
      })),
    []
  );

  const topBatters = useMemo(
    () => [
      { name: "A. Batter", runs: 412 },
      { name: "B. Allrounder", runs: 275 },
      { name: "E. Batter", runs: 231 },
      { name: "F. Batter", runs: 208 },
      { name: "G. Batter", runs: 190 },
    ],
    []
  );

  const wicketsByBowler = useMemo(
    () => [
      { name: "C. Bowler", wkts: 28 },
      { name: "I. Bowler", wkts: 22 },
      { name: "J. Bowler", wkts: 19 },
      { name: "K. Bowler", wkts: 17 },
    ],
    []
  );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Charts</h1>

      {/* Match-by-match points (Line) */}
      <section className="p-4 rounded-2xl bg-white shadow">
        <h2 className="font-semibold mb-2">Match by Match (Points)</h2>
        <div className="h-64">
          <Charts.ResponsiveContainer width="100%" height="100%">
            <Charts.LineChart data={matchByMatch} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <Charts.CartesianGrid strokeDasharray="3 3" />
              <Charts.XAxis dataKey="x" />
              <Charts.YAxis />
              <Charts.Tooltip />
              <Charts.Line type="monotone" dataKey="y" stroke="var(--brand)" strokeWidth={2} dot={false} />
            </Charts.LineChart>
          </Charts.ResponsiveContainer>
        </div>
      </section>

      {/* Top run scorers (Bar) */}
      <section className="p-4 rounded-2xl bg-white shadow">
        <h2 className="font-semibold mb-2">Top Run Scorers</h2>
        <div className="h-72">
          <Charts.ResponsiveContainer width="100%" height="100%">
            <Charts.BarChart data={topBatters} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <Charts.CartesianGrid strokeDasharray="3 3" />
              <Charts.XAxis dataKey="name" />
              <Charts.YAxis />
              <Charts.Tooltip />
              <Charts.Bar dataKey="runs" fill="var(--brand)" radius={[6, 6, 0, 0]} />
            </Charts.BarChart>
          </Charts.ResponsiveContainer>
        </div>
      </section>

      {/* Wickets by bowler (Bar) */}
      <section className="p-4 rounded-2xl bg-white shadow">
        <h2 className="font-semibold mb-2">Wickets by Bowler</h2>
        <div className="h-72">
          <Charts.ResponsiveContainer width="100%" height="100%">
            <Charts.BarChart data={wicketsByBowler} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <Charts.CartesianGrid strokeDasharray="3 3" />
              <Charts.XAxis dataKey="name" />
              <Charts.YAxis />
              <Charts.Tooltip />
              <Charts.Bar dataKey="wkts" fill="var(--brand)" radius={[6, 6, 0, 0]} />
            </Charts.BarChart>
          </Charts.ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
