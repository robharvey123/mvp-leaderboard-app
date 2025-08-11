import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Row = {
  player_id: string; player: string; total_points: number;
  runs: number; fours: number; sixes: number; wickets: number;
  maidens: number; five_wkts: number; catches: number; stumpings: number; run_outs: number;
};

export default function LeaderboardSeason({ clubName="Brookweald CC", season=new Date().getFullYear() }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("v_leaderboard_season")
        .select("*")
        .eq("club", clubName)
        .eq("season_year", season)
        .order("total_points", { ascending: false });
      if (error) setErr(error.message); else setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
  }, [clubName, season]);

  if (loading) return <div>Loading…</div>;
  if (err) return <div className="text-red-600">Error: {err}</div>;

  return (
    <div className="rounded-2xl border p-4 shadow-sm">
      <h3 className="text-xl font-semibold mb-2">Season Leaderboard — {clubName} ({season})</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b text-left">
            <tr><th>#</th><th className="pr-4">Player</th><th>Points</th><th>Runs</th><th>4s</th><th>6s</th><th>Wkts</th><th>Mdns</th><th>5-fors</th><th>Ct</th><th>St</th><th>RO</th></tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={r.player_id} className="border-b last:border-b-0">
                <td>{i+1}</td><td className="pr-4">{r.player}</td>
                <td className="font-semibold">{Number(r.total_points).toFixed(0)}</td>
                <td>{r.runs}</td><td>{r.fours}</td><td>{r.sixes}</td>
                <td>{r.wickets}</td><td>{r.maidens}</td><td>{r.five_wkts}</td>
                <td>{r.catches}</td><td>{r.stumpings}</td><td>{r.run_outs}</td>
              </tr>
            ))}
            {rows.length===0 && <tr><td colSpan={12} className="py-4 text-gray-500">No data yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
