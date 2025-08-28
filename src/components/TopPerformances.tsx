import { useMemo } from "react";
import { useOrg } from "@/context/OrgContext";
import { supabase } from "@/lib/supabaseClient";

type Perf = { player: string; match: string; points: number };

const DEMO: Perf[] = [
  { player: "Danny Finch", match: "v Opp XI (May 10)", points: 143 },
  { player: "Saf Abbas", match: "v Town CC (Jun 02)", points: 128 },
  { player: "Alfie Hedges", match: "v Heath (Jul 06)", points: 119 },
  { player: "Ryan Chapman", match: "v Vale (Jul 20)", points: 112 },
];

export default function TopPerformances() {
  const { clubId, seasonId } = useOrg();

  // Live later:
  // const { data } = await supabase.from("top_performances_view")
  //   .select("name, match_points, match_id")
  //   .eq("club_id", clubId).eq("season_id", seasonId)
  //   .order("match_points", { ascending: false }).limit(10);

  const rows: Perf[] = useMemo(() => DEMO, [clubId, seasonId]);

  return (
    <div className="bg-card rounded-2xl shadow-md border border-brand-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-brand-100"><h3 className="font-semibold">Top Performances</h3></div>
      <div className="p-4">
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-brand-100 px-3 py-2">
              <div>
                <div className="font-medium">{r.player}</div>
                <div className="text-xs text-text-soft">{r.match}</div>
              </div>
              <div className="text-sm font-semibold">{r.points} pts</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
