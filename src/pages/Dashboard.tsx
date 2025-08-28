import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from "recharts";

type MatchRow = {
  id: string;
  match_date: string | null;
  opponent: string | null;
  our_runs: number | null;
  opp_runs: number | null;
};
type BatRow = { player_id: string; player_name: string | null; runs: number | null; };
type BowlRow = { player_id: string; player_name: string | null; wickets: number | null; };

export default function Dashboard() {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [batTop, setBatTop] = useState<BatRow[]>([]);
  const [bowlTop, setBowlTop] = useState<BowlRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const ms = await supabase.from("v_match_summary")
          .select("id, match_date, opponent, our_runs, opp_runs")
          .order("match_date", { ascending: true });
        if (ms.error) throw ms.error;
        setMatches((ms.data ?? []) as MatchRow[]);

        const bat = await supabase.from("v_batting_totals_by_player")
          .select("player_id, player_name, runs")
          .order("runs", { ascending: false }).limit(10);
        if (bat.error) throw bat.error;
        setBatTop((bat.data ?? []) as BatRow[]);

        const bowl = await supabase.from("v_bowling_totals_by_player")
          .select("player_id, player_name, wickets")
          .order("wickets", { ascending: false }).limit(10);
        if (bowl.error) throw bowl.error;
        setBowlTop((bowl.data ?? []) as BowlRow[]);
      } catch (e: any) {
        setErr(e?.message || String(e));
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {err && <div className="text-red-700 text-sm">Error: {err}</div>}
      </div>

      {/* Runs per match */}
      <div className="rounded-xl border p-4">
        <div className="font-medium mb-2">Runs per match</div>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <LineChart data={matches.map(m => ({
              date: m.match_date || "",
              our: m.our_runs ?? null,
              opp: m.opp_runs ?? null
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="our" name="Us" dot={false} />
              <Line type="monotone" dataKey="opp" name="Opp" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top batters */}
      <div className="rounded-xl border p-4">
        <div className="font-medium mb-2">Top batters (total runs)</div>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={batTop.map(r => ({ name: r.player_name || "Unknown", runs: r.runs ?? 0 }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" interval={0} angle={-30} textAnchor="end" height={70} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="runs" name="Runs" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top bowlers */}
      <div className="rounded-xl border p-4">
        <div className="font-medium mb-2">Top bowlers (wickets)</div>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={bowlTop.map(r => ({ name: r.player_name || "Unknown", wickets: r.wickets ?? 0 }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" interval={0} angle={-30} textAnchor="end" height={70} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="wickets" name="Wickets" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
