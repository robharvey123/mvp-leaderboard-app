import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts";

const brand = (step: string) => `rgb(var(--brand-${step}))`;

// Use the same demo players from PlayersPage for consistency
const DEMO = [
  { name: "Danny Finch", batting: 1371, bowling: 480, fielding: 100 },
  { name: "Saf Abbas", batting: 659, bowling: 760, fielding: 50 },
  { name: "Alfie Hedges", batting: 853, bowling: 465, fielding: 120 },
  { name: "Rob Harvey", batting: 1048, bowling: 135, fielding: 30 },
  { name: "Ryan Chapman", batting: 925, bowling: 75, fielding: 130 },
  { name: "Hasnain Iqbal", batting: 74, bowling: 800, fielding: 40 },
];

export default function AnalyticsPage() {
  const stacked = useMemo(() => DEMO.map(d => ({ name: d.name, Batting: d.batting, Bowling: d.bowling, Fielding: d.fielding })), []);

  const weekly = [
    { week: "May-1", points: 220 },
    { week: "May-2", points: 310 },
    { week: "Jun-1", points: 540 },
    { week: "Jun-2", points: 480 },
    { week: "Jul-1", points: 620 },
    { week: "Jul-2", points: 590 },
    { week: "Aug-1", points: 710 },
    { week: "Aug-2", points: 680 },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <section className="bg-card rounded-2xl shadow-md border border-brand-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-brand-100"><h2 className="font-semibold">Contribution by category</h2></div>
        <div className="p-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stacked} stackOffset="sign">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Batting" stackId="a" fill={brand("600")} radius={[6,6,0,0]} />
              <Bar dataKey="Bowling" stackId="a" fill={brand("400")} radius={[6,6,0,0]} />
              <Bar dataKey="Fielding" stackId="a" fill={brand("200")} radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="bg-card rounded-2xl shadow-md border border-brand-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-brand-100"><h2 className="font-semibold">Weekly points trend</h2></div>
        <div className="p-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="points" stroke={brand("600")} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}