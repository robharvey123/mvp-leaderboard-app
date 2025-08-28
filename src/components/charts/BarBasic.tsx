import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "./Primitives";
import { defaultPalette } from "./palette";
import { fmtShort } from "./formatters";

type Series = string | { key: string; name?: string; fill?: string };
type Props = { data: any[]; x: string; series: Series[]; stacked?: boolean; yFormat?: (v:number)=>string };

const keyOf = (s: Series) => typeof s === "string" ? s : s.key;
const nameOf = (s: Series) => typeof s === "string" ? s : (s.name ?? s.key);

export default function BarBasic({ data, x, series, stacked = true, yFormat }: Props) {
  const stackId = stacked ? "1" : undefined;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ left: 8, right: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={x} tickMargin={6} />
        <YAxis tickFormatter={yFormat ?? fmtShort} width={56} />
        <Tooltip formatter={(v:any)=>typeof v === "number" ? (yFormat ?? fmtShort)(v) : v} />
        <Legend />
        {series.map((s, i) => {
          const key = keyOf(s);
          const name = nameOf(s);
          const fill = typeof s === "string" ? defaultPalette[i % defaultPalette.length] : (s.fill ?? defaultPalette[i % defaultPalette.length]);
          return <Bar key={key} dataKey={key} name={name} stackId={stackId} fill={fill} radius={[4,4,0,0]} />;
        })}
      </BarChart>
    </ResponsiveContainer>
  );
}
