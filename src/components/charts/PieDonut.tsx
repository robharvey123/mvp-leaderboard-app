import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { defaultPalette } from "./palette";

type Props = { data: { name: string; value: number }[] };
export default function PieDonut({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip />
        <Legend />
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%">
          {data.map((_, i) => <Cell key={i} fill={defaultPalette[i % defaultPalette.length]} />)}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
