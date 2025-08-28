import SeasonPicker from "@/components/SeasonPicker";
import StatCard from "@/components/cards/StatCard";
import PlayerLeaderboard from "@/components/analytics/PlayerLeaderboard";
import TeamComparison from "@/components/analytics/TeamComparison";
import { useFilters } from "@/context/FilterContext";
import { useEffect, useState } from "react";

export default function SeasonDashboard() {
  const { seasonId } = useFilters();
  const [totals, setTotals] = useState({ bat: 0, bowl: 0, field: 0, total: 0 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (import.meta.env.VITE_SUPABASE_URL) {
          const { supabase } = await import("@/lib/supabaseClient");
          // Simple aggregate; replace with a materialised view later
          const { data, error } = await supabase
            .from("points_events")
            .select("points, metric")
            .limit(2000);
          if (error) throw error;
          const next = { bat: 0, bowl: 0, field: 0, total: 0 };
          for (const r of data as any[]) {
            const p = Number(r.points || 0);
            next.total += p;
            if (["runs", "4", "6", "50", "100", "duck"].some(m => r.metric?.includes(m))) next.bat += p;
            else if (["wicket", "maiden", "3-for", "5-for", "econ"].some(m => r.metric?.includes(m))) next.bowl += p;
            else next.field += p;
          }
          if (!cancelled) setTotals(next);
        } else {
          if (!cancelled) setTotals({ bat: 820, bowl: 540, field: 160, total: 1520 });
        }
      } catch {
        if (!cancelled) setTotals({ bat: 820, bowl: 540, field: 160, total: 1520 });
      }
    })();
    return () => { cancelled = true; };
  }, [seasonId]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Season Dashboard</h1>
        <SeasonPicker />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Batting points" value={totals.bat} />
        <StatCard label="Bowling points" value={totals.bowl} />
        <StatCard label="Fielding points" value={totals.field} />
        <StatCard label="Total points" value={totals.total} />
      </div>

      <PlayerLeaderboard />
      <TeamComparison />
    </div>
  );
}
