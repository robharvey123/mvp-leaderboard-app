import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useOrg } from "../../context/OrgContext";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell
} from "recharts";

type MatchRow = { match_id: string; match_date: string; total_points: number };
type PlayerRow = { player_id: string; player_name: string; total_points: number };

export default function ClubOverview() {
  const { org } = useOrg();
  const [series, setSeries] = useState<MatchRow[]>([]);
  const [tops, setTops] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!org) return;
    (async () => {
      setLoading(true);

      const { data: s, error: e1 } = await supabase.rpc<MatchRow[]>("points_by_match", {
        p_club_id: org.id,
        p_limit: 30,
      });
      if (e1) console.error(e1);
      // chronological for charts
      const chronological = (s || []).slice().reverse();
      setSeries(chronological);

      const { data: t, error: e2 } = await supabase.rpc<PlayerRow[]>("top_players_points", {
        p_club_id: org.id,
        p_limit: 10,
      });
      if (e2) console.error(e2);
      setTops(t || []);
      setLoading(false);
    })();
  }, [org]);

  // ---- Derived series (no extra RPCs) ----
  // 1) 3-match rolling average
  const rolling = useMemo(() => {
    const w = 3;
    const out: { match_date: string; rolling_avg: number }[] = [];
    for (let i = 0; i < series.length; i++) {
      const start = Math.max(0, i - (w - 1));
      const slice = series.slice(start, i + 1);
      const avg = slice.reduce((a, r) => a + (r.total_points || 0), 0) / slice.length;
      out.push({ match_date: series[i].match_date, rolling_avg: Math.round(avg) });
    }
    return out;
  }, [series]);

  // 2) Cumulative points
  const cumulative = useMemo(() => {
    let sum = 0;
    return series.map((r) => {
      sum += r.total_points || 0;
      return { match_date: r.match_date, cumulative_points: sum };
    });
  }, [series]);

  // 3) Histogram (5 bins)
  const histogram = useMemo(() => {
    if (!series.length) return [] as { bin: string; count: number }[];
    const vals = series.map((r) => r.total_points || 0);
    const min = Math.min(...vals), max = Math.max(...vals);
    const bins = 5;
    const width = Math.max(1, Math.ceil((max - min + 1) / bins));
    const counts = new Array(bins).fill(0);
    for (const v of vals) {
      let idx = Math.floor((v - min) / width);
      if (idx >= bins) idx = bins - 1;
      counts[idx]++;
    }
    return counts.map((c, i) => {
      const from = min + i * width;
      const to = from + width - 1;
      return { bin: `${from}-${to}`, count: c };
    });
  }, [series]);

  // 4) Player share pie (top 6 + "Other")
  const playerShare = useMemo(() => {
    if (!tops.length) return [] as { name: string; value: number }[];
    const top6 = tops.slice(0, 6);
    const others = tops.slice(6);
    const sumOthers = others.reduce((a, r) => a + (r.total_points || 0), 0);
    const data = top6.map((p) => ({ name: p.player_name, value: Number(p.total_points) }));
    if (sumOthers > 0) data.push({ name: "Other", value: Number(sumOthers) });
    return data;
  }, [tops]);

  if (!org) return <div className="p-6">Select a club…</div>;

  return (
    <div className="p-6 grid gap-6 md:grid-cols-2">
      {/* 1. Total points by match */}
      <section className="p-4 rounded-2xl shadow bg-white">
        <h2 className="font-semibold mb-2">Club Momentum — Total Points by Match</h2>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="match_date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total_points" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {(!loading && series.length === 0) && <p style={{ marginTop: 8 }}>No data yet.</p>}
      </section>

      {/* 2. Rolling average */}
      <section className="p-4 rounded-2xl shadow bg-white">
        <h2 className="font-semibold mb-2">Rolling Avg (3 matches)</h2>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={rolling}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="match_date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="rolling_avg" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 3. Cumulative points */}
      <section className="p-4 rounded-2xl shadow bg-white">
        <h2 className="font-semibold mb-2">Cumulative Points</h2>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <AreaChart data={cumulative}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="match_date" />
              <YAxis />
              <Tooltip />
              <Area dataKey="cumulative_points" type="monotone" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 4. Distribution of match points */}
      <section className="p-4 rounded-2xl shadow bg-white">
        <h2 className="font-semibold mb-2">Points Distribution</h2>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={histogram}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bin" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 5. Top contributors */}
      <section className="p-4 rounded-2xl shadow bg-white">
        <h2 className="font-semibold mb-2">Top Contributors</h2>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={tops}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="player_name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total_points" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {(!loading && tops.length === 0) && <p style={{ marginTop: 8 }}>No player points yet.</p>}
      </section>

      {/* 6. Share of total points */}
      <section className="p-4 rounded-2xl shadow bg-white">
        <h2 className="font-semibold mb-2">Share of Points</h2>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <PieChart>
              <Tooltip />
              <Pie dataKey="value" data={playerShare} nameKey="name" outerRadius={120} label>
                {playerShare.map((_e, i) => <Cell key={i} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
