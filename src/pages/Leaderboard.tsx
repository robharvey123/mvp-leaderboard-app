import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type BatRow = { player_id: string; player_name: string | null; runs: number | null; inns: number | null };
type BowlRow = { player_id: string; player_name: string | null; wickets: number | null };

export default function Leaderboard() {
  const [bat, setBat] = useState<BatRow[]>([]);
  const [bowl, setBowl] = useState<BowlRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      setBusy(true);
      setErr(null);
      try {
        const b1 = await supabase
          .from("v_batting_totals_by_player")
          .select("player_id, player_name, runs, inns")
          .order("runs", { ascending: false })
          .limit(20);
        if (b1.error) throw b1.error;
        setBat((b1.data ?? []) as BatRow[]);

        const b2 = await supabase
          .from("v_bowling_totals_by_player")
          .select("player_id, player_name, wickets")
          .order("wickets", { ascending: false })
          .limit(20);
        if (b2.error) throw b2.error;
        setBowl((b2.data ?? []) as BowlRow[]);
      } catch (e: any) {
        setErr(e?.message || String(e));
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        {busy && <div className="text-slate-500 text-sm">Loading…</div>}
        {err && <div className="text-red-700 text-sm">Error: {err}</div>}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Batting */}
        <div className="rounded-xl border p-4">
          <div className="font-medium mb-2">Batting (total runs)</div>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left p-2">Player</th>
                <th className="text-right p-2">Inns</th>
                <th className="text-right p-2">Runs</th>
              </tr>
            </thead>
            <tbody>
              {bat.map(r => (
                <tr key={r.player_id} className="border-t">
                  <td className="p-2">{r.player_name || "Unknown"}</td>
                  <td className="p-2 text-right">{r.inns ?? "—"}</td>
                  <td className="p-2 text-right">{r.runs ?? 0}</td>
                </tr>
              ))}
              {!bat.length && !busy && (
                <tr><td className="p-2 text-slate-500" colSpan={3}>No batting data yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bowling */}
        <div className="rounded-xl border p-4">
          <div className="font-medium mb-2">Bowling (wickets)</div>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left p-2">Player</th>
                <th className="text-right p-2">Wickets</th>
              </tr>
            </thead>
            <tbody>
              {bowl.map(r => (
                <tr key={r.player_id} className="border-t">
                  <td className="p-2">{r.player_name || "Unknown"}</td>
                  <td className="p-2 text-right">{r.wickets ?? 0}</td>
                </tr>
              ))}
              {!bowl.length && !busy && (
                <tr><td className="p-2 text-slate-500" colSpan={2}>No bowling data yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
