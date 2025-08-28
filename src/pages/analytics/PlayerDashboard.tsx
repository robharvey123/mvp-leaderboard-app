// src/pages/analytics/PlayerDashboard.tsx
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { AreaBasic, BarBasic, LineBasic } from "@/components/charts";
import { usePlayerDashboard } from "@/hooks/usePlayerDashboard";
import useContextIds from "@/hooks/useContextIds";

/**
 * Supports routes:
 *   /players/:playerId        -> preferred (UUID or DB id)
 *   /players/:playerName      -> legacy fallback (uses the string as an id)
 *
 * Make sure your App.tsx defines: <Route path="players/:playerId" element={<PlayerDashboard />} />
 * If you're still on names, it will still render — just pass that string through to your hook.
 */
export default function PlayerDashboard() {
  const params = useParams<{ playerId?: string; playerName?: string }>();
  const { seasonId } = useContextIds();

  // Prefer playerId; fall back to playerName for older routes.
  const raw = params.playerId ?? params.playerName ?? "";
  const playerKey = useMemo(() => decodeURIComponent(raw), [raw]);

  // Early guards
  if (!playerKey) {
    return <div className="p-6">No player selected.</div>;
  }

  const { loading, error, charts, meta } = usePlayerDashboard(playerKey, seasonId);
  // charts is expected to shape: { pointsTrend, battingTrend, bowlingSeries }
  const pointsTrend = charts?.pointsTrend ?? [];
  const battingTrend = charts?.battingTrend ?? [];
  const bowlingSeries = charts?.bowlingSeries ?? [];

  const card = "p-4 rounded-2xl shadow bg-white";
  const h = "h-48";

  if (loading) return <div className="p-6">Loading player dashboard…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {String(error)}</div>;

  const displayName = meta?.playerName ?? playerKey; // let hook return a nice name if it can
  const seasonLabel = meta?.seasonName ?? "";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{displayName}</h1>
          {seasonLabel && (
            <p className="text-sm text-neutral-600">Season: {seasonLabel}</p>
          )}
        </div>
        {/* Quick KPIs if your hook provides them */}
        {meta?.kpis && (
          <div className="grid grid-cols-3 gap-3">
            <Kpi title="Total Points" value={meta.kpis.totalPoints} />
            <Kpi title="Runs" value={meta.kpis.totalRuns} />
            <Kpi title="Wickets" value={meta.kpis.totalWickets} />
          </div>
        )}
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Points by match (stacked: batting/bowling/fielding) */}
        <section className={card}>
          <h2 className="font-semibold mb-2">Points by Match</h2>
          <div className={h}>
            <AreaBasic
              data={pointsTrend}
              x="match"
              series={[
                { key: "batting", name: "Batting" },
                { key: "bowling", name: "Bowling" },
                { key: "fielding", name: "Fielding" },
              ]}
              stacked
              emptyMessage="No points data yet."
            />
          </div>
        </section>

        {/* Batting trend: runs & balls */}
        <section className={card}>
          <h2 className="font-semibold mb-2">Batting — Runs & Balls</h2>
          <div className={h}>
            <LineBasic
              data={battingTrend}
              x="match"
              series={["runs", "balls"]}
              emptyMessage="No batting data yet."
            />
          </div>
        </section>

        {/* Bowling: O-M-R-W view */}
        <section className={`${card} md:col-span-2`}>
          <h2 className="font-semibold mb-2">Bowling — Overs, Maidens, Runs, Wickets</h2>
          <div className={h}>
            <BarBasic
              data={bowlingSeries}
              x="match"
              series={[
                { key: "overs", name: "Overs" },
                { key: "maidens", name: "Maidens" },
                { key: "runs", name: "Runs Conceded" },
                { key: "wickets", name: "Wickets" },
              ]}
              stacked={false}
              emptyMessage="No bowling data yet."
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: number | string | undefined }) {
  return (
    <div className="rounded-xl border bg-white px-3 py-2 text-center">
      <div className="text-xs text-neutral-500">{title}</div>
      <div className="text-lg font-semibold">{value ?? "—"}</div>
    </div>
  );
}
