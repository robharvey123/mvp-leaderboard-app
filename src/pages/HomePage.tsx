import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  BattingPointsChart, 
  BattingRunsChart, 
  BowlingWicketsChart, 
  MVPPointsDistributionChart 
} from '@/components/charts';
import { getTopPlayers, getRecentMatches } from '@/lib/data-service';
import { PlayerMVPEntry, Match } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLinkIcon } from '@radix-ui/react-icons';

export default function HomePage() {
  const [topPlayers, setTopPlayers] = useState<PlayerMVPEntry[]>([]);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [players, matches] = await Promise.all([
          getTopPlayers(5),
          getRecentMatches(3)
        ]);
        
        setTopPlayers(players);
        setRecentMatches(matches);
        setError(null);
      } catch (err) {
        console.error('Error fetching homepage data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container mx-auto py-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-800 rounded-lg p-8 mb-8 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Brookweald Cricket Club</h1>
          <p className="text-xl mb-6">
            Track player statistics and follow the MVP leaderboard for the current season
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link to="/leaderboard">View Leaderboard</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/players">Browse Players</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <h2 className="text-2xl font-bold mb-4 dark:text-white">Statistics Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <BattingPointsChart />
        <BattingRunsChart />
        <BowlingWicketsChart />
        <MVPPointsDistributionChart />
      </div>

      {/* Top Players and Recent Matches */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Players */}
        <Card>
          <CardHeader>
            <CardTitle>Top MVP Players</CardTitle>
            <CardDescription>Current season's leaders</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <p className="text-destructive text-center py-4">{error}</p>
            ) : topPlayers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No player data available</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPlayers.map((player, index) => (
                    <TableRow key={player.playerId}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{player.playerName || `Player ${player.playerId.slice(0, 4)}`}</TableCell>
                      <TableCell className="text-right font-bold">{player.totalMVPPoints}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/players/${player.playerId}`}>
                            <ExternalLinkIcon className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="mt-4 text-center">
              <Button asChild variant="outline" size="sm">
                <Link to="/leaderboard">View Full Leaderboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Matches */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Matches</CardTitle>
            <CardDescription>Latest match results</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <p className="text-destructive text-center py-4">{error}</p>
            ) : recentMatches.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No recent matches available</p>
            ) : (
              <div className="space-y-4">
                {recentMatches.map((match) => (
                  <Card key={match.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">vs {match.opposition}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(match.date).toLocaleDateString()} • {match.venue}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={
                            match.result === 'WIN' ? 'text-green-600 font-medium' :
                            match.result === 'LOSS' ? 'text-red-600 font-medium' :
                            'text-amber-600 font-medium'
                          }>
                            {match.result}
                          </p>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/matches/${match.id}`}>Details</Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <div className="mt-4 text-center">
              <Button asChild variant="outline" size="sm">
                <Link to="/matches">View All Matches</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}