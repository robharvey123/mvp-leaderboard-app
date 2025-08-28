// src/components/charts/LinePoints.tsx
import ChartCard from "./ChartCard";
import {
  ChartContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  numberFmt
} from "./Primitives";

export type LineDatum = { x: string | number; y: number };

export default function LinePoints({
  title = "Points by Match",
  subtitle,
  data,
  xKey = "x",
  yKey = "y",
}: {
  title?: string; subtitle?: string;
  data: LineDatum[];
  xKey?: keyof LineDatum; yKey?: keyof LineDatum;
}) {
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <ChartContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey as string} />
          <YAxis tickFormatter={numberFmt} />
          <Tooltip formatter={(v: any) => numberFmt(v)} />
          <Legend />
          <Line type="monotone" dataKey={yKey as string} dot={false} strokeWidth={2} />
        </LineChart>
      </ChartContainer>
    </ChartCard>
  );
}
