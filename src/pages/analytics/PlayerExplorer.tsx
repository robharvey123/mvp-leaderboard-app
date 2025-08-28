import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useOrg } from "../../context/OrgContext";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type Player = { player_id: string; player_name: string; total_points: number };
type Row = { match_date: string; points: number };

export default function PlayerExplorer() {
  const { org } = useOrg();
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerId, setPlayerId] = useState<string>("");
  const [series, setSeries] = useState<Row[]>([]);

  useEffect(() => {
    if (!org) return;
    (async () => {
      const { data } = await supabase.rpc<Player[]>("top_players_points", { p_club_id: org.id, p_limit: 20 });
      setPlayers(data || []);
      if (data && data[0]) setPlayerId(data[0].player_id);
    })();
  }, [org]);

  useEffect(() => {
    if (!org || !playerId) return;
    (async () => {
      const { data } = await supabase.rpc<Row[]>("player_points_by_match", { p_club_id: org.id, p_player_id: playerId, p_limit: 20 });
      setSeries((data || []).slice().reverse());
    })();
  }, [org, playerId]);

  if (!org) return <div className="p-6">Select a club…</div>;
  return (
    <div className="p-6 space-y-4">
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label>Player</label>
        <select value={playerId} onChange={(e) => setPlayerId(e.target.value)} className="border rounded px-2 py-1">
          {players.map(p => <option key={p.player_id} value={p.player_id}>{p.player_name}</option>)}
        </select>
      </div>

      <section className="p-4 rounded-2xl shadow bg-white">
        <h2 className="font-semibold mb-2">Points by Match</h2>
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="match_date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="points" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
