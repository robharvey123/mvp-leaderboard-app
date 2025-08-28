// src/pages/analytics/SeasonDashboard.tsx
import { useEffect, useState } from "react";
import SeasonPicker from "@/components/SeasonPicker";
import StatCard from "@/components/cards/StatCard";
import PlayerLeaderboard from "@/components/analytics/PlayerLeaderboard";
import TeamComparison from "@/components/analytics/TeamComparison";
import { useFilters } from "@/context/FilterContext";
import DebugBoundary from "@/components/DebugBoundary";

// Small native select to avoid extra deps. You can swap to shadcn Select later.
function TopNSelect({
  value,
  onChange,
}: {
  value: number | "all";
  onChange: (v: number | "all") => void;
}) {
  return (
    <label className="text-sm flex items-center gap-2">
      Show
      <select
        className="border rounded px-2 py-1"
        value={String(value)}
        onChange={(e) => {
          const v = e.target.value === "all" ? "all" : Number(e.target.value);
          onChange(v);
        }}
      >
        <option value="5">Top 5</option>
        <option value="10">Top 10</option>
        <option value="20">Top 20</option>
        <option value="all">All</option>
      </select>
      players
    </label>
  );
}

export default function SeasonDashboard() {
  const { seasonId } = useFilters(); // relies on src/context/FilterContext.tsx exporting useFilters
  const [totals, setTotals] = useState({ bat: 0, bowl: 0, field: 0, total: 0 });
  const [source, setSource] = useState<"demo" | "supabase" | "error">("demo");
  const [topN, setTopN] = useState<number | "all">(10);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // If Supabase env is not present, use demo numbers
        if (!import.meta.env.VITE_SUPABASE_URL) {
          if (!cancelled) {
            setTotals({ bat: 820, bowl: 540, field: 160, total: 1520 });
            setSource("demo");
          }
          return;
        }

        const { supabase } = await import("@/lib/supabaseClient");
        // Keep this simple and robust: pull atomic events and bucket by metric text.
        // If you later add a season_id to points_events or a view, filter here with .eq(...)
        const { data, error } = await supabase
          .from("points_events")
          .select("points, metric")
          .limit(5000);

        if (error) throw error;

        const next = { bat: 0, bowl: 0, field: 0, total: 0 };
        for (const r of (data as any[]) || []) {
          const p = Number(r.points || 0);
          next.total += p;
          const m = String(r.metric || "");
          if (/(runs|^4$|^6$|50|100|duck)/i.test(m)) next.bat += p;
          else if (/(wicket|maiden|3-for|5-for|econ)/i.test(m)) next.bowl += p;
          else next.field += p;
        }

        if (!cancelled) {
          const hasData = next.total > 0;
          setTotals(hasData ? next : { bat: 0, bowl: 0, field: 0, total: 0 });
          setSource(hasData ? "supabase" : "demo");
        }
      } catch (e) {
        console.error("[SeasonDashboard] aggregate failed", e);
        if (!cancelled) {
          setTotals({ bat: 820, bowl: 540, field: 160, total: 1520 });
          setSource("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [seasonId]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Season Dashboard</h1>
        <div className="flex items-center gap-3">
          <TopNSelect value={topN} onChange={setTopN} />
          <SeasonPicker />
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Data source: <span className="font-medium">{source}</span>{" "}
        {seasonId ? `| season ${seasonId}` : "| all seasons"}{" "}
        {topN === "all" ? "| All players" : `| Top ${topN}`}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Batting points" value={totals.bat} />
        <StatCard label="Bowling points" value={totals.bowl} />
        <StatCard label="Fielding points" value={totals.field} />
        <StatCard label="Total points" value={totals.total} />
      </div>

      <DebugBoundary name="PlayerLeaderboard">
        {/* If your PlayerLeaderboard supports a topN/limit prop, this will be used; otherwise it's ignored. */}
        <PlayerLeaderboard {...({ topN } as any)} />
      </DebugBoundary>

      <DebugBoundary name="TeamComparison">
        {/* Same pattern: pass through topN hint; component may ignore if not implemented. */}
        <TeamComparison {...({ topN } as any)} />
      </DebugBoundary>
    </div>
  );
}
