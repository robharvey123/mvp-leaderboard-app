import ChartCard from "@/components/charts/ChartCard";
import LineBasic from "@/components/charts/LineBasic";
import BarBasic from "@/components/charts/BarBasic";
import AreaBasic from "@/components/charts/AreaBasic";
import PieDonut from "@/components/charts/PieDonut";
import ScatterBasic from "@/components/charts/ScatterBasic";

const seriesData = Array.from({ length: 10 }).map((_, i) => ({
  label: `Wk ${i + 1}`,
  batting: Math.floor(Math.random() * 80),
  bowling: Math.floor(Math.random() * 60),
  fielding: Math.floor(Math.random() * 20),
}));

const pieData = [
  { name: "Batting", value: 420 },
  { name: "Bowling", value: 280 },
  { name: "Fielding", value: 90 },
];

const scatterData = Array.from({ length: 28 }).map(() => ({
  x: Math.round(20 + Math.random() * 80),   // strike rate
  y: Math.round(Math.random() * 5),         // wickets
}));

export default function ChartsShowcase() {
  return (
    <div className="p-6 grid gap-6 md:grid-cols-2">
      <ChartCard title="Weekly points (line)">
        <LineBasic data={seriesData} x="label" series={[
          { key: "batting", name: "Batting" },
          { key: "bowling", name: "Bowling" },
        ]}/>
      </ChartCard>

      <ChartCard title="Points split (donut)">
        <PieDonut data={pieData} />
      </ChartCard>

      <ChartCard title="Cumulative (area)">
        <AreaBasic data={seriesData} x="label" series={[
          { key: "batting" }, { key: "bowling" }, { key: "fielding" },
        ]}/>
      </ChartCard>

      <ChartCard title="Totals by week (bar)">
        <BarBasic data={seriesData} x="label" series={[
          { key: "batting" }, { key: "bowling" }, { key: "fielding" },
        ]}/>
      </ChartCard>

      <div className="md:col-span-2">
        <ChartCard title="Strike rate vs wickets (scatter)">
          <ScatterBasic data={scatterData} xLabel="SR" yLabel="Wkts" />
        </ChartCard>
      </div>
    </div>
  );
}
