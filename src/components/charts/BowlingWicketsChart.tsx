import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartCard } from './ChartCard';
import { getPlayers, getTopPlayers } from '@/lib/data-service';
import { Player, PlayerMVPEntry } from '@/types';
import { useChartTheme } from '@/lib/chart-theme';

interface BowlingWicketsChartProps {
  limit?: number;
  className?: string;
}

/**
 * A chart component that displays the top bowlers by wickets
 */
export function BowlingWicketsChart({ limit = 5, className = '' }: BowlingWicketsChartProps) {
  const [data, setData] = useState<{ name: string; wickets: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chartTheme = useChartTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // In a real implementation, we would fetch player statistics directly
        // For demo purposes, we'll generate sample data based on players
        const players = await getPlayers();
        const topPlayers = await getTopPlayers(limit);
        
        // Get top bowlers based on bowling points
        const topBowlers = [...topPlayers].sort((a, b) => b.bowlingPoints - a.bowlingPoints);
        
        // Combine player data with top players data
        const playerMap = new Map<string, Player>();
        players.forEach(player => {
          playerMap.set(player.playerId, player);
        });
        
        // Create mock wicket data based on bowling points
        // In a real app, you would fetch actual bowling stats
        const wicketData = topBowlers.map(player => {
          const playerInfo = playerMap.get(player.playerId);
          const name = playerInfo 
            ? `${playerInfo.firstName} ${playerInfo.lastName}`
            : player.playerName || `Player ${player.playerId.slice(0, 4)}`;
            
          // Mock: generate wickets roughly based on bowling points
          // In a real app, use actual statistics
          const wickets = Math.floor(player.bowlingPoints / 25);
          
          return { name, wickets };
        });
        
        // Sort by wickets in descending order
        const sortedData = wicketData.sort((a, b) => b.wickets - a.wickets);
        setData(sortedData.slice(0, limit));
        setError(null);
      } catch (err) {
        console.error('Error fetching bowling data:', err);
        setError('Failed to load bowling data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [limit]);

  return (
    <ChartCard 
      title="Top Bowlers by Wickets" 
      description="Players with the highest wicket counts"
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
            formatter={(value) => [`${value} wickets`, 'Total Wickets']}
            labelFormatter={(name) => `Player: ${name}`}
            contentStyle={{ 
              backgroundColor: chartTheme.tooltip.background,
              borderColor: chartTheme.tooltip.border,
              color: chartTheme.tooltip.text
            }}
          />
          <Legend wrapperStyle={{ color: chartTheme.text.fill }} />
          <Bar 
            dataKey="wickets" 
            name="Total Wickets" 
            fill={chartTheme.colors.bowling} 
            radius={[4, 4, 0, 0]}
            animationDuration={1500}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}