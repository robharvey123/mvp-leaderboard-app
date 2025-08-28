import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useOrg } from "@/context/OrgContext";
import { usePlayerLeaderboard } from "@/lib/data/hooks";
import {
  ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { ArrowLeft } from "lucide-react";

// Demo fallback (same shape as PlayersPage rows)
const DEMO = [
  { name: "Danny Finch", total: 1974, batting: 1371, bowling: 480, fielding: 100, penalty: -13 },
  { name: "Saf Abbas", total: 1470, batting: 659, bowling: 760, fielding: 50,  penalty: -35 },
  { name: "Alfie Hedges", total: 1416, batting: 853, bowling: 465, fielding: 120, penalty: -55 },
];

const brand = (step: string) => `rgb(var(--brand-${step}))`;

export default function PlayerProfilePage() {
  const { name: routeName } = useParams<{ name: string }>();
  const name = decodeURIComponent(routeName ?? "");
  const { clubId, seasonId } = useOrg();
  const { data: liveRows } = usePlayerLeaderboard(clubId, seasonId);

  const row = useMemo(() => {
    const src = (liveRows && liveRows.length)
      ? liveRows.map(p => ({
          name: p.name, total: p.total, batting: p.batting, bowling: p.bowling, fielding: p.fielding, penalty: p.penalty
        }))
      : DEMO;
    return src.find(r => r.name.toLowerCase() === name.toLowerCase()) ?? src[0];
  }, [liveRows, name]);

  if (!row) {
    return (
      <div className="p-4">
        <Link to="/players" className="inline-flex items-center gap-2 text-sm text-text-soft hover:text-text-strong">
          <ArrowLeft size={16} /> Back to Players
        </Link>
        <h1 className="text-2xl font-bold mt-3">Player not found</h1>
      </div>
    );
  }

  // Fake per-week series now; swap to real match/weekly data later
  const weekly = useMemo(() => {
    const base = Math.max(10, Math.round(row.total / 12));
    return Array.from({ length: 12 }).map((_, i) => ({
      wk: `W${i + 1}`,
      points: Math.round(base + (Math.sin(i / 2) * base) / 3 + (i % 3 === 0 ? base / 4 : 0)),
    }));
  }, [row.total]);

  const cat = [
    { name: "Batting", value: Math.max(0, row.batting) || 1, fill: brand("600") },
    { name: "Bowling", value: Math.max(0, row.bowling) || 1, fill: brand("400") },
    { name: "Fielding", value: Math.max(0, row.fielding) || 1, fill: brand("200") },
  ];

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Link to="/players" className="inline-flex items-center gap-2 text-sm text-text-soft hover:text-text-strong">
          <ArrowLeft size={16} /> Back
        </Link>
        <h1 className="text-2xl font-bold">{row.name}</h1>
        <span className="ml-auto inline-flex items-center gap-1 rounded-xl bg-brand-100 text-brand-800 border border-brand-200 px-3 py-1.5">
          Total <strong className="ml-1">{new Intl.NumberFormat().format(row.total)}</strong>
        </span>
      </div>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl shadow-md border border-brand-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-100"><h2 className="font-semibold">Category split</h2></div>
          <div className="p-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={cat} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} stroke="transparent">
                    {cat.map((c, i) => <Cell key={i} fill={c.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: any, n: any) => [`${v} pts`, n]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-sm text-text-soft">
              Batting {cat[0].value} • Bowling {cat[1].value} • Fielding {cat[2].value}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-md border border-brand-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-100"><h2 className="font-semibold">Weekly points</h2></div>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="wk" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="points" stroke={brand("600")} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="bg-card rounded-2xl shadow-md border border-brand-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-brand-100"><h2 className="font-semibold">Snapshot</h2></div>
        <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <Chip label="Batting pts" value={row.batting} />
          <Chip label="Bowling pts" value={row.bowling} />
          <Chip label="Fielding pts" value={row.fielding} />
          <Chip label="Penalty" value={row.penalty} />
        </div>
      </section>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-2">
      <div className="text-[11px] text-text-soft">{label}</div>
      <div className="text-base font-semibold">{new Intl.NumberFormat().format(Number(value))}</div>
    </div>
  );
}
