import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type Row = { player_name:string; bat:number; bowl:number; field:number };
export default function PointsBreakdownChart({ data }: { data: Row[] }) {
  // Show top 8 by total
  const rows = [...data]
    .sort((a,b) => (b.bat+b.bowl+b.field)-(a.bat+a.bowl+a.field))
    .slice(0, 8)
    .map(r => ({ name: r.player_name, Bat: r.bat, Bowl: r.bowl, Field: r.field }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={rows} stackOffset="expand" margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="Bat" stackId="a" />
          <Bar dataKey="Bowl" stackId="a" />
          <Bar dataKey="Field" stackId="a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
