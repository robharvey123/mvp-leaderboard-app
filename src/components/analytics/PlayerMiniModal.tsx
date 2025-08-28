import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

type MatchPts = { match: string; bat: number; bowl: number; field: number; total: number };

export default function PlayerMiniModal({
  player,
  open,
  onClose,
}: {
  player?: string;
  open: boolean;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<MatchPts[]>([]);
  const [source, setSource] = useState<"demo" | "supabase" | "error">("demo");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!player) return;
      try {
        if (import.meta.env.VITE_SUPABASE_URL) {
          const { supabase } = await import("@/lib/supabaseClient");
          // Example: pull the last 10 matches of points for this player
          // Adjust to your schema/views later
          const { data: pe, error } = await supabase
            .from("points_events")
            .select("points,metric,match_id, matches:match_id(match_date)")
            .eq("players.full_name", player) // requires a join view in Supabase; if not present, fallback
            .limit(2000);
          if (error) throw error;

          const map: Record<string, MatchPts> = {};
          for (const r of (pe as any[]) || []) {
            const key = r.match_id || "M";
            const date = r.matches?.match_date || key;
            if (!map[key]) map[key] = { match: String(date), bat: 0, bowl: 0, field: 0, total: 0 };
            const p = Number(r.points || 0);
            map[key].total += p;
            const m = String(r.metric || "");
            if (/(runs|^4$|^6$|50|100|duck)/i.test(m)) map[key].bat += p;
            else if (/(wicket|maiden|3-for|5-for|econ)/i.test(m)) map[key].bowl += p;
            else map[key].field += p;
          }
          const arr = Object.values(map)
            .sort((a, b) => a.match.localeCompare(b.match))
            .slice(-10);
          if (!cancelled) {
            setRows(arr.length ? arr : demoRows(player));
            setSource(arr.length ? "supabase" : "demo");
          }
        } else {
          if (!cancelled) {
            setRows(demoRows(player));
            setSource("demo");
          }
        }
      } catch {
        if (!cancelled) {
          setRows(demoRows(player!));
          setSource("error");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [player]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        bat: acc.bat + r.bat,
        bowl: acc.bowl + r.bowl,
        field: acc.field + r.field,
        total: acc.total + r.total,
      }),
      { bat: 0, bowl: 0, field: 0, total: 0 }
    );
  }, [rows]);

  return (
    <Modal open={open} onClose={onClose} title={player ? `Player mini dashboard — ${player}` : "Player"}>
      <div className="text-xs text-gray-500 mb-3">Source: {source}</div>

      <div className="grid gap-3 md:grid-cols-4">
        <Tile label="Batting points" value={totals.bat} />
        <Tile label="Bowling points" value={totals.bowl} />
        <Tile label="Fielding points" value={totals.field} />
        <Tile label="Total points" value={totals.total} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ChartBlock title="Batting points by match">
          <LineSeries data={rows.map(r => ({ x: r.match, y: r.bat }))} />
        </ChartBlock>
        <ChartBlock title="Bowling points by match">
          <LineSeries data={rows.map(r => ({ x: r.match, y: r.bowl }))} />
        </ChartBlock>
      </div>
    </Modal>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

function ChartBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="font-semibold text-sm mb-2">{title}</div>
      <div className="h-40">{children}</div>
    </div>
  );
}

function LineSeries({ data }: { data: { x: string; y: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="x" tick={{ fontSize: 11 }} />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="y" />
      </LineChart>
    </ResponsiveContainer>
  );
}

function demoRows(player?: string): MatchPts[] {
  const base = Math.floor(Math.random() * 6);
  const mk = (i: number) => ({
    match: `M${i + 1}`,
    bat: base * 2 + ((i * 7) % 9),
    bowl: base + ((i * 5) % 7),
    field: ((i * 3) % 5),
    total: 0,
  });
  const arr = Array.from({ length: 8 }, (_, i) => mk(i)).map(r => ({ ...r, total: r.bat + r.bowl + r.field }));
  // small tweak so it looks plausibly like the named player is good 🙂
  if (player) arr[arr.length - 1].bat += 10;
  return arr;
}
