// src/pages/analytics/TeamStats.tsx
import { useMemo } from "react";
import { AreaBasic, BarBasic, LineBasic } from "@/components/charts";
import { useTeamStats } from "@/hooks/useTeamStats";
import useContextIds from "@/hooks/useContextIds";

type TrendPoint = { match: string; resultPts?: number };
type BattingPoint = { match: string; top?: number; middle?: number; lower?: number };
type BowlingPoint = { match: string; threeFors?: number; fiveFors?: number };

export default function TeamStats() {
  const { teamId, seasonId } = useContextIds();
  const { loading, error, charts, meta } = useTeamStats?.(teamId, seasonId) ?? {
    loading: false,
    error: undefined,
    charts: undefined,
    meta: undefined,
  };

  // Safe fallbacks to avoid crashes if hook returns nothing yet
  const resultTrend: TrendPoint[] = charts?.resultTrend ?? [];
  const battingSplit: BattingPoint[] = charts?.battingSplit ?? [];
  const bowlingReturns: BowlingPoint[] = charts?.bowlingReturns ?? [];

  const teamName = meta?.teamName ?? "Team";
  const seasonName = meta?.seasonName ?? "";

  const card = "p-4 rounded-2xl shadow bg-white";
  const h = "h-48";

  // Optional: derive a win% headline if your trend uses +2 win, +1 tie, 0 no result, -1 loss, etc.
  const kpis = useMemo(() => {
    const pts = resultTrend.map(p => p.resultPts ?? 0);
    const wins = pts.filter(p => p > 0).length;
    const games = pts.length || 0;
    const winPct = games ? Math.round((wins / games) * 100) : 0;
    return { wins, games, winPct };
  }, [resultTrend]);

  if (!teamId) {
    return <div className="p-6">No team selected.</div>;
  }
  if (loading) {
    return <div className="p-6">Loading team stats…</div>;
  }
  if (error) {
    return <div className="p-6 text-red-600">Error: {String(error)}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{teamName} — Team Stats</h1>
          {seasonName && (
            <p className="text-sm text-neutral-600">Season: {seasonName}</p>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <Kpi title="Matches" value={kpis.games} />
          <Kpi title="Wins" value={kpis.wins} />
          <Kpi title="Win %" value={`${kpis.winPct}%`} />
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* A) Results trendline */}
        <section className={card}>
          <h2 className="font-semibold mb-2">Results Trend</h2>
          <p className="text-xs text-neutral-500 mb-3">
            Positive = wins, negative = losses, per match order.
          </p>
          <div className={h}>
            <LineBasic
              data={resultTrend}
              x="match"
              series={["resultPts"]}
              emptyMessage="No result trend yet."
            />
          </div>
        </section>

        {/* B) Batting contribution split */}
        <section className={card}>
          <h2 className="font-semibold mb-2">Batting Contribution (Runs by Order)</h2>
          <p className="text-xs text-neutral-500 mb-3">
            Stacked totals by top-order (1-3), middle (4-7), lower (8-11).
          </p>
          <div className={h}>
            <AreaBasic
              data={battingSplit}
              x="match"
              series={[
                { key: "top", name: "Top" },
                { key: "middle", name: "Middle" },
                { key: "lower", name: "Lower" },
              ]}
              stacked
              emptyMessage="No batting split yet."
            />
          </div>
        </section>

        {/* C) Bowling returns timeline */}
        <section className={`${card} md:col-span-2`}>
          <h2 className="font-semibold mb-2">Bowling Returns — 3-fors & 5-fors</h2>
          <p className="text-xs text-neutral-500 mb-3">
            Count of innings with 3+ wickets and 5-wicket hauls per match.
          </p>
          <div className={h}>
            <BarBasic
              data={bowlingReturns}
              x="match"
              series={[
                { key: "threeFors", name: "3-fors" },
                { key: "fiveFors", name: "5-fors" },
              ]}
              stacked={false}
              emptyMessage="No bowling returns yet."
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-xl border bg-white px-3 py-2 text-center">
      <div className="text-xs text-neutral-500">{title}</div>
      <div className="text-lg font-semibold">{value ?? "—"}</div>
    </div>
  );
}
