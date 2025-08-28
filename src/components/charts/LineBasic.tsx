import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "./Primitives";
import { defaultPalette } from "./palette";
import { fmtShort } from "./formatters";

type Series = string | { key: string; name?: string; stroke?: string };
type Props = { data: any[]; x: string; series: Series[]; yFormat?: (v:number)=>string; smooth?: boolean };

const keyOf = (s: Series) => typeof s === "string" ? s : s.key;
const nameOf = (s: Series) => typeof s === "string" ? s : (s.name ?? s.key);

export default function LineBasic({ data, x, series, yFormat, smooth = true }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ left: 8, right: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={x} tickMargin={6} />
        <YAxis tickFormatter={yFormat ?? fmtShort} width={56} />
        <Tooltip formatter={(v:any)=>typeof v === "number" ? (yFormat ?? fmtShort)(v) : v} />
        <Legend />
        {series.map((s, i) => {
          const key = keyOf(s);
          const name = nameOf(s);
          const stroke = typeof s === "string" ? defaultPalette[i % defaultPalette.length] : (s.stroke ?? defaultPalette[i % defaultPalette.length]);
          return <Line key={key} type={smooth ? "monotone" : "linear"} dataKey={key} name={name} stroke={stroke} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />;
        })}
      </LineChart>
    </ResponsiveContainer>
  );
}
