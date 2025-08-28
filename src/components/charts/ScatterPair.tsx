// src/components/charts/ScatterPair.tsx
import ChartCard from "./ChartCard";
import {
  ChartContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, numberFmt
} from "./Primitives";

export type ScatterDatum = { x: number; y: number; z?: number; label?: string };

export default function ScatterPair({
  title = "Economy vs Wicket Rate",
  subtitle,
  data,
}: {
  title?: string; subtitle?: string;
  data: ScatterDatum[];
}) {
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <ChartContainer>
        <ScatterChart>
          <CartesianGrid />
          <XAxis type="number" dataKey="x" name="X" tickFormatter={numberFmt} />
          <YAxis type="number" dataKey="y" name="Y" tickFormatter={numberFmt} />
          <ZAxis type="number" dataKey="z" range={[60, 200]} />
          <Tooltip formatter={(v: any) => numberFmt(v)} />
          <Legend />
          <Scatter data={data} />
        </ScatterChart>
      </ChartContainer>
    </ChartCard>
  );
}
