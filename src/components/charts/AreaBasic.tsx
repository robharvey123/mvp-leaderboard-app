// src/components/charts/AreaBasic.tsx
import { jsxDEV } from "react/jsx-dev-runtime";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { defaultPalette } from "./palette";
import { fmtShort } from "./formatters"; // assumes you have a number formatter

type SeriesDef =
  | string
  | {
      key: string;
      name?: string;
      stroke?: string;
      fill?: string;
    };

type Props = {
  data: any[];
  /** x-axis field name in each data item */
  x: string;
  /** list of series (dataKeys) or series config objects */
  series: SeriesDef[];
  /** stack the areas together (default true) */
  stacked?: boolean;
  /** optional custom y-axis formatter */
  yFormat?: (v: number) => string;
};

function resolveKey(s: SeriesDef) {
  return typeof s === "string" ? s : s.key;
}
function resolveName(s: SeriesDef) {
  return typeof s === "string" ? s : s.name ?? s.key;
}

export default function AreaBasic({
  data,
  x,
  series,
  stacked = true,
  yFormat,
}: Props) {
  const stackId = stacked ? "1" : undefined;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ left: 8, right: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={x} tickMargin={6} />
        <YAxis
          tickFormatter={yFormat ?? ((v: number) => fmtShort(v))}
          width={56}
        />
        <Tooltip
          formatter={(value: any) =>
            typeof value === "number" ? (yFormat ?? fmtShort)(value) : value
          }
        />
        <Legend />

        {series.map((s, i) => {
          const key = resolveKey(s);
          const name = resolveName(s);
          const color =
            typeof s === "string"
              ? defaultPalette[i % defaultPalette.length]
              : s.fill ?? s.stroke ?? defaultPalette[i % defaultPalette.length];

          return (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              name={name}
              stroke={color}
              fill={color}
              fillOpacity={0.25}
              stackId={stackId}
              activeDot={{ r: 4 }}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
}
