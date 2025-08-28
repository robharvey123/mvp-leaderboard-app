import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useOrg } from "../../context/OrgContext";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type MatchRow = {
  match_id: string; match_date: string;
  bat_points: number; bowl_points: number; fld_points: number;
  other_points: number; total_points: number;
};

type PlayerRow = {
  player_id: string; player_name: string;
  batting_points: number; bowling_points: number; fielding_points: number;
  other_points: number; total_points: number;
};

export default function CategoryBreakdown() {
  const { org } = useOrg();
  const [byMatch, setByMatch] = useState<MatchRow[]>([]);
  const [byPlayer, setByPlayer] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!org) return;
    (async () => {
      setLoading(true);

      const { data: m, error: e1 } = await supabase.rpc<MatchRow[]>("points_breakdown_by_match", {
        p_club_id: org.id, p_limit: 20
      });
      if (e1) console.error(e1);
      setByMatch((m || []).slice().reverse());

      const { data: p, error: e2 } = await supabase.rpc<PlayerRow[]>("player_category_totals", {
        p_club_id: org.id, p_limit: 12
      });
      if (e2) console.error(e2);
      setByPlayer(p || []);

      setLoading(false);
    })();
  }, [org]);

  if (!org) return <div className="p-6">Select a club…</div>;

  return (
    <div className="p-6 grid gap-6 md:grid-cols-2">
      {/* Stacked bars by match */}
      <section className="p-4 rounded-2xl shadow bg-white md:col-span-2">
        <h2 className="font-semibold mb-2">Category Breakdown by Match</h2>
        <div style={{ width: "100%", height: 340 }}>
          <ResponsiveContainer>
            <BarChart data={byMatch}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="match_date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="bat_points" stackId="a" />
              <Bar dataKey="bowl_points" stackId="a" />
              <Bar dataKey="fld_points" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {(!loading && byMatch.length === 0) && <p style={{marginTop:8}}>No data yet.</p>}
      </section>

      {/* Stacked bars by player */}
      <section className="p-4 rounded-2xl shadow bg-white md:col-span-2">
        <h2 className="font-semibold mb-2">Category Totals by Player</h2>
        <div style={{ width: "100%", height: 420 }}>
          <ResponsiveContainer>
            <BarChart data={byPlayer}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="player_name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="batting_points" stackId="p" />
              <Bar dataKey="bowling_points" stackId="p" />
              <Bar dataKey="fielding_points" stackId="p" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {(!loading && byPlayer.length === 0) && <p style={{marginTop:8}}>No player category data yet.</p>}
      </section>
    </div>
  );
}
