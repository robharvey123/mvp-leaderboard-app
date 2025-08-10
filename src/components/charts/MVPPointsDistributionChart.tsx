import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartCard } from './ChartCard';
import { getLeaderboard } from '@/lib/data-service';
import { PlayerMVPEntry } from '@/types';
import { useChartTheme } from '@/lib/chart-theme';

interface MVPPointsDistributionChartProps {
  className?: string;
}

// Define proper types for the chart label props
interface PieLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  index: number;
}

/**
 * A chart component that displays the distribution of MVP points by category
 */
export function MVPPointsDistributionChart({ className = '' }: MVPPointsDistributionChartProps) {
  const [data, setData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chartTheme = useChartTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch overall leaderboard data
        const leaderboard = await getLeaderboard();
        
        // Calculate totals for each category
        let totalBatting = 0;
        let totalBowling = 0;
        let totalFielding = 0;
        let totalTeam = 0;
        let totalSpecial = 0;
        
        leaderboard.forEach(entry => {
          totalBatting += entry.battingPoints;
          totalBowling += entry.bowlingPoints;
          totalFielding += entry.fieldingPoints;
          totalTeam += entry.teamPoints;
          totalSpecial += entry.specialPoints;
        });
        
        // Prepare data for pie chart using chart theme colors
        const chartData = [
          { name: 'Batting', value: totalBatting, color: chartTheme.colors.batting },
          { name: 'Bowling', value: totalBowling, color: chartTheme.colors.bowling },
          { name: 'Fielding', value: totalFielding, color: chartTheme.colors.fielding },
          { name: 'Team', value: totalTeam, color: chartTheme.colors.team },
        ];
        
        // Only add special points if they exist (they can be negative)
        if (totalSpecial !== 0) {
          chartData.push({ 
            name: 'Special', 
            value: Math.abs(totalSpecial), 
            color: totalSpecial > 0 ? chartTheme.colors.special : chartTheme.colors.negative 
          });
        }
        
        setData(chartData);
        setError(null);
      } catch (err) {
        console.error('Error fetching MVP distribution data:', err);
        setError('Failed to load MVP points distribution data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ 
    cx, 
    cy, 
    midAngle, 
    innerRadius, 
    outerRadius, 
    percent 
  }: PieLabelProps) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill={chartTheme.text.contrast} 
        textAnchor="middle" 
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ChartCard 
      title="MVP Points Distribution" 
      description="Breakdown of points by category across all players"
      isLoading={isLoading}
      error={error}
      className={className}
    >
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [`${value} points`, 'Total Points']}
            contentStyle={{ 
              backgroundColor: chartTheme.tooltip.background,
              borderColor: chartTheme.tooltip.border,
              color: chartTheme.tooltip.text
            }}
          />
          <Legend 
            wrapperStyle={{ color: chartTheme.text.fill }} 
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}