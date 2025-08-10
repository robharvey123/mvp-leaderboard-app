import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartCard } from './ChartCard';
import { getTopPlayers } from '@/lib/data-service';
import { PlayerMVPEntry } from '@/types';
import { useChartTheme } from '@/lib/chart-theme';

interface BattingPointsChartProps {
  limit?: number;
  className?: string;
}

/**
 * A chart component that displays the top batsmen by MVP points
 */
export function BattingPointsChart({ limit = 5, className = '' }: BattingPointsChartProps) {
  const [data, setData] = useState<PlayerMVPEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chartTheme = useChartTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const players = await getTopPlayers(limit);
        // Sort by batting points in descending order
        const sortedPlayers = [...players].sort((a, b) => b.battingPoints - a.battingPoints);
        setData(sortedPlayers.slice(0, limit));
        setError(null);
      } catch (err) {
        console.error('Error fetching batting points data:', err);
        setError('Failed to load batting points data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [limit]);

  const chartData = data.map((player) => ({
    name: player.playerName || `Player ${player.playerId.slice(0, 4)}`,
    points: player.battingPoints,
  }));

  return (
    <ChartCard 
      title="Top Batsman Points" 
      description="Players with the highest batting MVP points"
      isLoading={isLoading}
      error={error}
      className={className}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} />
          <XAxis 
            dataKey="name" 
            angle={-45} 
            textAnchor="end" 
            height={60}
            tick={{ fontSize: 12, fill: chartTheme.text.fill }}
            stroke={chartTheme.text.fill}
          />
          <YAxis 
            tick={{ fill: chartTheme.text.fill }}
            stroke={chartTheme.text.fill}
          />
          <Tooltip 
            formatter={(value) => [`${value} points`, 'Batting Points']}
            labelFormatter={(name) => `Player: ${name}`}
            contentStyle={{ 
              backgroundColor: chartTheme.tooltip.background,
              borderColor: chartTheme.tooltip.border,
              color: chartTheme.tooltip.text
            }}
          />
          <Legend wrapperStyle={{ color: chartTheme.text.fill }} />
          <Bar 
            dataKey="points" 
            name="Batting Points" 
            fill={chartTheme.colors.batting}
            radius={[4, 4, 0, 0]}
            animationDuration={1500}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}