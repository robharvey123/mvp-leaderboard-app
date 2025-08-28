// src/components/analytics/PlayerLeaderboard.tsx
import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "@/components/charts/Primitives";
import PlayerMiniModal from "@/components/ui/PlayerMiniModal";
import { useFilters } from "@/context/FilterContext";

type Row = { playerId: string; name: string; bat: number; bowl: number; field: number; total: number };

export default function PlayerLeaderboard({ topN = 10 }: { topN?: number | "all" }) {
  const { seasonId } = useFilters();
  const [selected, setSelected] = useState<Row | null>(null);

  // ⛑️ Always produce an array
  const rows: Row[] = useMemo(() => {
    // TODO: replace with Supabase aggregate for seasonId
    const demo: Row[] = [
      { playerId: "1", name: "A. Cook", bat: 320, bowl: 40, field: 10, total: 370 },
      { playerId: "2", name: "B. Stokes", bat: 210, bowl: 160, field: 20, total: 390 },
      { playerId: "3", name: "C. Archer", bat: 80, bowl: 300, field: 15, total: 395 },
      { playerId: "4", name: "D. Root", bat: 340, bowl: 20, field: 18, total: 378 },
      { playerId: "5", name: "E. Rashid", bat: 120, bowl: 260, field: 22, total: 402 },
      { playerId: "6", name: "F. Foakes", bat: 260, bowl: 0,   field: 40, total: 300 },
      { playerId: "7", name: "G. Brook", bat: 285, bowl: 15,  field: 5,  total: 305 },
      { playerId: "8", name: "H. Mahmood", bat: 40,  bowl: 220, field: 8,  total: 268 },
      { playerId: "9", name: "I. Willey", bat: 150, bowl: 170, field: 12, total: 332 },
      { playerId: "10", name: "J. Bairstow", bat: 295, bowl: 0, field: 25, total: 320 },
      { playerId: "11", name: "K. Wood", bat: 55, bowl: 185, field: 10, total: 250 },
    ];
    const base = Array.isArray(demo) ? demo : [];
    // Sort by total desc, slice to Top N
    const sorted = base.sort((a, b) => b.total - a.total);
    return topN === "all" ? sorted : sorted.slice(0, topN);
  }, [seasonId, topN]);

  if (!rows.length) {
    return <div className="text-sm text-gray-500">No player data for this season yet.</div>;
  }

  return (
    <section className="p-4 rounded-2xl shadow bg-white">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Player Leaderboard</h2>
        <div className="text-xs text-gray-500">{topN === "all" ? "All players" : `Top ${topN}`}</div>
      </div>

      <div className="h-72">
        <ResponsiveContainer>
          <BarChart data={rows} margin={{ left: 12, right: 12 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-30} height={50} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" onClick={(d: any) => setSelected(d?.payload as Row)} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {selected && (
        <PlayerMiniModal
          open={!!selected}
          onOpenChange={(o) => !o && setSelected(null)}
          playerId={selected.playerId}
          header={selected.name}
          stats={[
            { label: "Bat", value: selected.bat },
            { label: "Bowl", value: selected.bowl },
            { label: "Field", value: selected.field },
            { label: "Total", value: selected.total },
          ]}
        />
      )}
    </section>
  );
}
