// src/components/charts/PieBreakdown.tsx
import ChartCard from "./ChartCard";
import { ChartContainer, PieChart, Pie, Tooltip, Legend, Cell, numberFmt } from "./Primitives";

export type PieDatum = { name: string; value: number };

export default function PieBreakdown({
  title = "Category Split",
  subtitle,
  data,
}: {
  title?: string; subtitle?: string;
  data: PieDatum[];
}) {
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <ChartContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius="80%">
            {data.map((_, i) => <Cell key={i} />)}
          </Pie>
          <Tooltip formatter={(v: any) => numberFmt(v)} />
          <Legend />
        </PieChart>
      </ChartContainer>
    </ChartCard>
  );
}
