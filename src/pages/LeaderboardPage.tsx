import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { 
  BattingPointsChart, 
  BattingRunsChart, 
  BowlingWicketsChart, 
  MVPPointsDistributionChart 
} from '@/components/charts';
import { getLeaderboard } from '@/lib/data-service';
import { PlayerMVPEntry } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<PlayerMVPEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboardData = async () => {
    try {
      setLoading(true);
      const data = await getLeaderboard();
      setLeaderboardData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching leaderboard data:', err);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboardData();
  }, []);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Brookweald CC MVP Leaderboard</h1>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <BattingPointsChart />
        <BattingRunsChart />
        <BowlingWicketsChart />
        <MVPPointsDistributionChart />
      </div>
      
      {/* Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle>MVP Standings</CardTitle>
          <CardDescription>Current season leaderboard standings</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={loadLeaderboardData}>Retry</Button>
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No leaderboard data available yet.</p>
              <Button onClick={loadLeaderboardData}>Refresh Leaderboard</Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-right">Batting</TableHead>
                    <TableHead className="text-right">Bowling</TableHead>
                    <TableHead className="text-right">Fielding</TableHead>
                    <TableHead className="text-right">Team</TableHead>
                    <TableHead className="text-right">Special</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboardData.map((entry, index) => (
                    <TableRow key={entry.playerId}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{entry.playerName || `Player ${entry.playerId.slice(0, 4)}`}</TableCell>
                      <TableCell className="text-right">{entry.battingPoints}</TableCell>
                      <TableCell className="text-right">{entry.bowlingPoints}</TableCell>
                      <TableCell className="text-right">{entry.fieldingPoints}</TableCell>
                      <TableCell className="text-right">{entry.teamPoints}</TableCell>
                      <TableCell className="text-right">{entry.specialPoints}</TableCell>
                      <TableCell className="text-right font-bold">{entry.totalMVPPoints}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end mt-4">
                <Button onClick={loadLeaderboardData} variant="outline">
                  Refresh
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}