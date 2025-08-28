import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { defaultPalette } from "./palette";

type Props = {
  data: { x: number; y: number; name?: string }[];
  xLabel?: string;
  yLabel?: string;
};
export default function ScatterBasic({ data, xLabel = "X", yLabel = "Y" }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ left: 8, right: 8, bottom: 8 }}>
        <CartesianGrid />
        <XAxis type="number" dataKey="x" name={xLabel} />
        <YAxis type="number" dataKey="y" name={yLabel} />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
        <Legend />
        <Scatter data={data} fill={defaultPalette[2]} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
