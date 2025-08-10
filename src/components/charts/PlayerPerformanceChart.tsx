import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartCard } from './ChartCard';
import { getPlayerMVPPoints, getMatches } from '@/lib/data-service';
import { Match } from '@/types';
import { useChartTheme } from '@/lib/chart-theme';

interface PlayerPerformanceChartProps {
  playerId?: string;
  className?: string;
}

/**
 * A chart component that displays a player's MVP points over time
 */
export function PlayerPerformanceChart({ playerId, className = '' }: PlayerPerformanceChartProps) {
  const [data, setData] = useState<Array<{
    matchId: string;
    matchDate: string;
    opponent: string;
    totalPoints: number;
    battingPoints: number;
    bowlingPoints: number;
    fieldingPoints: number;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chartTheme = useChartTheme();

  useEffect(() => {
    const fetchData = async () => {
      if (!playerId) {
        setIsLoading(false);
        setError('Player ID is required');
        return;
      }

      try {
        setIsLoading(true);
        
        // In a real implementation, we would fetch player match performances
        // For demo purposes, we'll generate sample data based on recent matches
        const matches = await getMatches();
        const playerPoints = await getPlayerMVPPoints(playerId);
        
        // Sort matches by date
        const sortedMatches = [...matches].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        // Generate performance data for recent matches
        // In a real app, you would fetch actual performance data
        const performanceData = sortedMatches.slice(-5).map((match, index) => {
          // Create mock data points that trend upwards to simulate improvement
          // In a real app, use actual match performance data
          const basePoints = 20 + index * 10;
          const variability = Math.random() * 30 - 15; // Random variability
          
          const battingPoints = Math.max(0, Math.floor(basePoints * 0.5 + variability));
          const bowlingPoints = Math.max(0, Math.floor(basePoints * 0.3 + variability));
          const fieldingPoints = Math.max(0, Math.floor(basePoints * 0.2 + variability));
          const totalPoints = battingPoints + bowlingPoints + fieldingPoints;
          
          return {
            matchId: match.id,
            matchDate: new Date(match.date).toLocaleDateString(),
            opponent: match.opposition,
            totalPoints,
            battingPoints,
            bowlingPoints,
            fieldingPoints
          };
        });
        
        setData(performanceData);
        setError(null);
      } catch (err) {
        console.error('Error fetching player performance data:', err);
        setError('Failed to load player performance data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [playerId]);

  if (!playerId) {
    return (
      <ChartCard 
        title="Player Performance Over Time" 
        error="No player selected"
        className={className}
      >
        <div className="text-center text-muted-foreground py-8">
          Select a player to view performance data
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard 
      title="Player Performance Over Time" 
      description="MVP points earned in recent matches"
      isLoading={isLoading}
      error={error}
      className={className}
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 30,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} />
          <XAxis 
            dataKey="opponent" 
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
            formatter={(value) => [`${value} points`, undefined]} 
            contentStyle={{ 
              backgroundColor: chartTheme.tooltip.background,
              borderColor: chartTheme.tooltip.border,
              color: chartTheme.tooltip.text
            }}
          />
          <Legend wrapperStyle={{ color: chartTheme.text.fill }} />
          <Line 
            type="monotone" 
            dataKey="totalPoints" 
            stroke={chartTheme.colors.total} 
            activeDot={{ r: 8, fill: chartTheme.colors.total }}
            name="Total Points" 
            strokeWidth={2}
          />
          <Line 
            type="monotone" 
            dataKey="battingPoints" 
            stroke={chartTheme.colors.batting} 
            name="Batting Points"
            strokeWidth={1}
          />
          <Line 
            type="monotone" 
            dataKey="bowlingPoints" 
            stroke={chartTheme.colors.bowling} 
            name="Bowling Points"
            strokeWidth={1}
          />
          <Line 
            type="monotone" 
            dataKey="fieldingPoints" 
            stroke={chartTheme.colors.fielding} 
            name="Fielding Points"
            strokeWidth={1}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}