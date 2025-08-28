// src/components/charts/AreaStack.tsx
import ChartCard from "./ChartCard";
import {
  ChartContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, numberFmt
} from "./Primitives";

type Key = string;

export default function AreaStack({
  title = "Points Breakdown Over Time",
  subtitle,
  data,
  xKey,
  series, // e.g. ['bat', 'bowl', 'field']
}: {
  title?: string; subtitle?: string;
  data: any[];
  xKey: Key;
  series: Key[];
}) {
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <ChartContainer height={320}>
        <AreaChart data={data} stackOffset="expand">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
          <Tooltip formatter={(v: any) => numberFmt(v)} />
          <Legend />
          {series.map((k) => (
            <Area key={k} type="monotone" dataKey={k} stackId="1" />
          ))}
        </AreaChart>
      </ChartContainer>
    </ChartCard>
  );
}
