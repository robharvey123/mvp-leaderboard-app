import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useChartTheme } from "@/context/chart-theme";

type Row = { match: string; wickets: number };

// TODO: Replace with real data from Supabase
const sample: Row[] = [
  { match: "Match 1", wickets: 1 },
  { match: "Match 2", wickets: 3 },
  { match: "Match 3", wickets: 2 },
  { match: "Match 4", wickets: 5 },
];

export default function BowlingWicketsChart({ data = sample }: { data?: Row[] }) {
  const c = useChartTheme();
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="wicketsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={c.fillAlt} stopOpacity={0.8} />
              <stop offset="95%" stopColor={c.fillAlt} stopOpacity={0.1} />
            </linearGradient>
          </defs>
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
          <Area type="monotone" dataKey="wickets" stroke={c.stroke} fill="url(#wicketsFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
