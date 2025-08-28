import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { useChartTheme } from "@/context/chart-theme";

type Row = { name: string; value: number };

// TODO: Replace with real data from Supabase
const sample: Row[] = [
  { name: "Batting", value: 180 },
  { name: "Bowling", value: 220 },
  { name: "Fielding", value: 60 },
];

export default function MVPPointsDistributionChart({ data = sample }: { data?: Row[] }) {
  const c = useChartTheme();
  const palette = [c.fill, c.fillAlt, c.stroke];

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            labelClassName="text-sm"
            contentStyle={{
              background: c.tooltipBg,
              border: `1px solid ${c.tooltipBorder}`,
              borderRadius: 8,
            }}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={palette[i % palette.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
