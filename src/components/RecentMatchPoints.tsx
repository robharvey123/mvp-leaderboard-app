import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Row = {
  player: string;
  opposition: string;
  played_on: string; // ISO
  runs: number; fours: number; sixes: number;
  wickets: number; maidens: number; five_wickets: boolean;
  catches: number; stumpings: number; run_outs: number;
  points: number;
};

export default function RecentMatchPoints({ clubName = "Brookweald CC" }: { clubName?: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("v_player_match_points")
        .select("player, opposition, played_on, runs, fours, sixes, wickets, maidens, five_wickets, catches, stumpings, run_outs, points, club")
        .eq("club", clubName)
        .order("played_on", { ascending: false })
        .limit(20);
      if (error) setErr(error.message);
      else setRows((data ?? []) as Row[]);
    })();
  }, [clubName]);

  if (err) return <div className="p-3 text-red-600">Error: {err}</div>;

  return (
    <div className="p-4 rounded-2xl border shadow-sm">
      <h3 className="text-lg font-semibold mb-2">Recent match points — {clubName}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left border-b">
            <tr>
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Player</th>
              <th className="py-2 pr-4">Opposition</th>
              <th className="py-2 pr-4">Runs</th>
              <th className="py-2 pr-4">Wkts</th>
              <th className="py-2 pr-4">Mdns</th>
              <th className="py-2 pr-4">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b last:border-b-0">
                <td className="py-2 pr-4">{new Date(r.played_on).toLocaleDateString()}</td>
                <td className="py-2 pr-4">{r.player}</td>
                <td className="py-2 pr-4">{r.opposition}</td>
                <td className="py-2 pr-4">{r.runs}</td>
                <td className="py-2 pr-4">{r.wickets}</td>
                <td className="py-2 pr-4">{r.maidens}</td>
                <td className="py-2 pr-4 font-semibold">{Number(r.points).toFixed(0)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="py-4 text-gray-500" colSpan={7}>No recent entries.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
