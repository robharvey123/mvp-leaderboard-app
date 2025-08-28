// src/components/charts/BarSimple.tsx
import ChartCard from "./ChartCard";
import {
  ChartContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, numberFmt
} from "./Primitives";

export type BarDatum = { label: string; value: number };

export default function BarSimple({
  title = "Totals",
  subtitle,
  data,
  xKey = "label",
  yKey = "value",
}: {
  title?: string; subtitle?: string;
  data: BarDatum[];
  xKey?: keyof BarDatum; yKey?: keyof BarDatum;
}) {
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <ChartContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey as string} />
          <YAxis tickFormatter={numberFmt} />
          <Tooltip formatter={(v: any) => numberFmt(v)} />
          <Legend />
          <Bar dataKey={yKey as string} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}
