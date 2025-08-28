import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useChartTheme } from "@/context/chart-theme";

type Row = { match: string; points: number };

// TODO: Replace with real data from Supabase
const sample: Row[] = [
  { match: "Match 1", points: 24 },
  { match: "Match 2", points: 31 },
  { match: "Match 3", points: 12 },
  { match: "Match 4", points: 44 },
];

export default function BattingPointsChart({ data = sample }: { data?: Row[] }) {
  const c = useChartTheme();
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke={c.grid} strokeDasharray="3 3" />
          <XAxis dataKey="match" stroke={c.axis} />
          <YAxis stroke={c.axis} />
          <Tooltip
            labelClassName="text-sm"
            contentStyle={{
              background: c.tooltipBg,
              border: `1px solid ${c.tooltipBorder}`,
              borderRadius: 8,
            }}
          />
          <Line type="monotone" dataKey="points" stroke={c.stroke} dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
