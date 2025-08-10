import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PlayerPerformanceChart } from '@/components/charts';
import { getPlayerById, getPlayerMVPPoints } from '@/lib/data-service';
import { Player, PointsBreakdown } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function PlayerProfilePage() {
  const { playerId } = useParams<{ playerId: string }>();
  const [player, setPlayer] = useState<Player | null>(null);
  const [pointsBreakdown, setPointsBreakdown] = useState<PointsBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlayerData = async () => {
      if (!playerId) {
        setLoading(false);
        setError('Player ID is required');
        return;
      }

      try {
        setLoading(true);
        const playerData = await getPlayerById(playerId);
        const mvpPoints = await getPlayerMVPPoints(playerId);
        
        if (playerData) {
          setPlayer(playerData);
          setPointsBreakdown(mvpPoints);
          setError(null);
        } else {
          setError('Player not found');
        }
      } catch (err) {
        console.error('Error loading player data:', err);
        setError('Failed to load player data');
      } finally {
        setLoading(false);
      }
    };

    loadPlayerData();
  }, [playerId]);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Player Profile</h1>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{player ? `${player.firstName} ${player.lastName}` : 'Player Information'}</CardTitle>
              <CardDescription>Personal details and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3">
                  <div className="aspect-square bg-muted rounded-md flex items-center justify-center">
                    <span className="text-4xl">👤</span>
                  </div>
                </div>
                <div className="w-full md:w-2/3">
                  {player ? (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold">{player.firstName} {player.lastName}</h2>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Type</p>
                          <p>{player.playerType}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Batting Style</p>
                          <p>{player.battingStyle || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Bowling Style</p>
                          <p>{player.bowlingStyle || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total MVP Points</p>
                          <p className="font-bold">
                            {pointsBreakdown?.totalPoints || '0'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground mt-2">
                      Player details will be displayed here when connected to data service.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Performance Chart */}
          <div className="mb-6">
            <PlayerPerformanceChart playerId={playerId} />
          </div>
          
          <Tabs defaultValue="statistics">
            <TabsList className="mb-4">
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
              <TabsTrigger value="matches">Match History</TabsTrigger>
              <TabsTrigger value="mvp">MVP Points</TabsTrigger>
            </TabsList>
            
            <TabsContent value="statistics">
              <Card>
                <CardHeader>
                  <CardTitle>Player Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  {player ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Batting Statistics</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium">Matches</TableCell>
                                <TableCell>{pointsBreakdown?.matchesPlayed || '0'}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Innings</TableCell>
                                <TableCell>{pointsBreakdown?.battingInnings || '0'}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Runs</TableCell>
                                <TableCell>{pointsBreakdown?.totalRuns || '0'}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">High Score</TableCell>
                                <TableCell>{pointsBreakdown?.highScore || '0'}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Batting Points</TableCell>
                                <TableCell className="font-bold">{pointsBreakdown?.battingPoints || '0'}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Bowling Statistics</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium">Matches</TableCell>
                                <TableCell>{pointsBreakdown?.matchesPlayed || '0'}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Wickets</TableCell>
                                <TableCell>{pointsBreakdown?.totalWickets || '0'}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Best Bowling</TableCell>
                                <TableCell>{pointsBreakdown?.bestBowling || '0/0'}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Maidens</TableCell>
                                <TableCell>{pointsBreakdown?.totalMaidens || '0'}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Bowling Points</TableCell>
                                <TableCell className="font-bold">{pointsBreakdown?.bowlingPoints || '0'}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <Alert>
                      <AlertDescription>
                        Statistics will be displayed when connected to data service.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="matches">
              <Card>
                <CardHeader>
                  <CardTitle>Match History</CardTitle>
                </CardHeader>
                <CardContent>
                  {player ? (
                    pointsBreakdown?.recentMatches && pointsBreakdown.recentMatches.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Opponent</TableHead>
                            <TableHead className="text-right">Batting</TableHead>
                            <TableHead className="text-right">Bowling</TableHead>
                            <TableHead className="text-right">Total Points</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pointsBreakdown.recentMatches.map((match) => (
                            <TableRow key={match.matchId}>
                              <TableCell>{new Date(match.date).toLocaleDateString()}</TableCell>
                              <TableCell>{match.opponent}</TableCell>
                              <TableCell className="text-right">{match.battingFigures || 'DNB'}</TableCell>
                              <TableCell className="text-right">{match.bowlingFigures || 'DNB'}</TableCell>
                              <TableCell className="text-right font-bold">{match.mvpPoints}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No match history available</p>
                    )
                  ) : (
                    <Alert>
                      <AlertDescription>
                        Match history will be displayed when connected to data service.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="mvp">
              <Card>
                <CardHeader>
                  <CardTitle>MVP Point History</CardTitle>
                </CardHeader>
                <CardContent>
                  {player && pointsBreakdown ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Batting</p>
                              <p className="text-2xl font-bold">{pointsBreakdown.battingPoints}</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Bowling</p>
                              <p className="text-2xl font-bold">{pointsBreakdown.bowlingPoints}</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Fielding</p>
                              <p className="text-2xl font-bold">{pointsBreakdown.fieldingPoints}</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Team</p>
                              <p className="text-2xl font-bold">{pointsBreakdown.teamPoints}</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Total</p>
                              <p className="text-2xl font-bold">{pointsBreakdown.totalPoints}</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="mt-6 text-center">
                        <Button>View Detailed Breakdown</Button>
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <AlertDescription>
                        MVP point breakdown will be displayed when connected to data service.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}