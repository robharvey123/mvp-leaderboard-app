import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartCard } from './ChartCard';
import { getPlayers, getTopPlayers } from '@/lib/data-service';
import { Player, PlayerMVPEntry, PlayerStats } from '@/types';
import { useChartTheme } from '@/lib/chart-theme';

interface BattingRunsChartProps {
  limit?: number;
  className?: string;
}

/**
 * A chart component that displays the top batsmen by run scores
 */
export function BattingRunsChart({ limit = 5, className = '' }: BattingRunsChartProps) {
  const [data, setData] = useState<{ name: string; runs: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chartTheme = useChartTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // In a real implementation, we would fetch player statistics
        // For demo purposes, we'll generate sample data based on players
        const players = await getPlayers();
        const topPlayers = await getTopPlayers(limit);
        
        // Combine player data with top players data
        const playerMap = new Map<string, Player>();
        players.forEach(player => {
          playerMap.set(player.playerId, player);
        });
        
        // Create mock run data based on batting points
        // In a real app, you would fetch actual batting stats
        const runData = topPlayers.map(player => {
          const playerInfo = playerMap.get(player.playerId);
          const name = playerInfo 
            ? `${playerInfo.firstName} ${playerInfo.lastName}`
            : player.playerName || `Player ${player.playerId.slice(0, 4)}`;
            
          // Mock: generate runs roughly based on batting points
          // In a real app, use actual statistics
          const runs = Math.floor(player.battingPoints * (1.5 + Math.random() * 0.5));
          
          return { name, runs };
        });
        
        // Sort by runs in descending order
        const sortedData = runData.sort((a, b) => b.runs - a.runs);
        setData(sortedData.slice(0, limit));
        setError(null);
      } catch (err) {
        console.error('Error fetching batting runs data:', err);
        setError('Failed to load batting runs data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [limit]);

  return (
    <ChartCard 
      title="Top Batsman Run Scores" 
      description="Players with the highest run totals"
      isLoading={isLoading}
      error={error}
      className={className}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
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
            formatter={(value) => [`${value} runs`, 'Total Runs']}
            labelFormatter={(name) => `Player: ${name}`}
            contentStyle={{ 
              backgroundColor: chartTheme.tooltip.background,
              borderColor: chartTheme.tooltip.border,
              color: chartTheme.tooltip.text
            }}
          />
          <Legend wrapperStyle={{ color: chartTheme.text.fill }} />
          <Bar 
            dataKey="runs" 
            name="Total Runs" 
            fill={chartTheme.colors.batting} 
            radius={[4, 4, 0, 0]}
            animationDuration={1500}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}