import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useChartTheme } from "@/context/chart-theme";

type Row = { player: string; runs: number };

// TODO: Replace with real data from Supabase
const sample: Row[] = [
  { player: "A. Smith", runs: 72 },
  { player: "B. Jones", runs: 41 },
  { player: "C. Patel", runs: 15 },
  { player: "D. Khan", runs: 88 },
];

export default function BattingRunsChart({ data = sample }: { data?: Row[] }) {
  const c = useChartTheme();
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke={c.grid} strokeDasharray="3 3" />
          <XAxis dataKey="player" stroke={c.axis} />
          <YAxis stroke={c.axis} />
          <Tooltip
            labelClassName="text-sm"
            contentStyle={{
              background: c.tooltipBg,
              border: `1px solid ${c.tooltipBorder}`,
              borderRadius: 8,
            }}
          />
          <Bar dataKey="runs" fill={c.fill} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
