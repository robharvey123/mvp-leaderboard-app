import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { getTopPlayers, getRecentMatches } from '@/lib/storage-service';
import { PlayerMVPEntry, Match } from '@/types';
import { ChevronRight } from 'lucide-react';

export default function Dashboard() {
  const [topPlayers, setTopPlayers] = useState<PlayerMVPEntry[]>([]);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setIsLoading(true);
        // Fetch top 5 players from leaderboard
        const players = await getTopPlayers(5);
        setTopPlayers(players);
        
        // Fetch 3 most recent matches
        const matches = await getRecentMatches(3);
        setRecentMatches(matches);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadDashboardData();
  }, []);

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric', 
      month: 'long', 
      year: 'numeric'
    });
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          {user ? `Welcome, ${user.name}` : 'Brookweald Cricket Club'}
        </h1>
        <p className="mt-2 text-slate-600">
          MVP Leaderboard and Performance Tracking
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Top Players Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-xl font-bold">Season Leaderboard</CardTitle>
                <CardDescription>Top performing players this season</CardDescription>
              </div>
              <Link to="/leaderboard">
                <Button variant="outline" size="sm" className="text-blue-700">
                  View Full Leaderboard
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading leaderboard...</div>
              ) : topPlayers.length > 0 ? (
                <div className="space-y-4">
                  {topPlayers.map((player, index) => (
                    <Link to={`/players/${player.playerId}`} key={player.entryId} className="block">
                      <div className="flex items-center justify-between hover:bg-gray-50 p-3 rounded-md">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 font-bold">
                            {index + 1}
                          </div>
                          <div className="ml-3">
                            <p className="font-medium">{player.playerName}</p>
                            <div className="flex space-x-2 text-xs text-gray-500 mt-1">
                              <span>Batting: {player.battingPoints}</span>
                              <span>•</span>
                              <span>Bowling: {player.bowlingPoints}</span>
                              <span>•</span>
                              <span>Fielding: {player.fieldingPoints}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-xl font-bold text-blue-700">
                          {player.totalMVPPoints}
                          <span className="text-sm font-normal text-gray-500 ml-1">pts</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No player data available yet
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Recent Matches Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-xl font-bold">Recent Matches</CardTitle>
                <CardDescription>Latest games played by Brookweald CC</CardDescription>
              </div>
              <Link to="/matches">
                <Button variant="outline" size="sm" className="text-blue-700">
                  View All Matches
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading matches...</div>
              ) : recentMatches.length > 0 ? (
                <div className="space-y-4">
                  {recentMatches.map((match) => (
                    <Link to={`/matches/${match.matchId}`} key={match.matchId} className="block">
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-medium text-blue-700">vs {match.opponent}</h3>
                              <p className="text-sm text-gray-500">{formatDate(match.matchDate)}</p>
                              <p className="text-sm font-medium mt-1">
                                {match.result === 'Win' && <span className="text-green-600">Won</span>}
                                {match.result === 'Loss' && <span className="text-red-600">Lost</span>}
                                {match.result === 'Draw' && <span className="text-amber-600">Draw</span>}
                                {match.result === 'No Result' && <span className="text-gray-600">No Result</span>}
                                {match.resultDetails && <span> - {match.resultDetails}</span>}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No matches available yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar Content */}
        <div className="space-y-6">
          {/* Club Announcements */}
          <Card>
            <CardHeader>
              <CardTitle>Club Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4 py-1">
                  <p className="font-medium">Next Match: July 31, 2025</p>
                  <p className="text-sm text-gray-500">Away vs Epping CC</p>
                </div>
                <div className="border-l-4 border-green-500 pl-4 py-1">
                  <p className="font-medium">Annual Dinner: August 15, 2025</p>
                  <p className="text-sm text-gray-500">Tickets now available</p>
                </div>
                <div className="border-l-4 border-amber-500 pl-4 py-1">
                  <p className="font-medium">Weekly Training</p>
                  <p className="text-sm text-gray-500">Wednesdays 6pm-8pm</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Performance Highlights */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Highlights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-3 rounded-md border border-amber-100">
                  <p className="text-amber-800 font-medium">John Smith scored a century</p>
                  <p className="text-sm text-amber-600">vs Chelmsford CC</p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-md border border-green-100">
                  <p className="text-green-800 font-medium">Andrew Brown took 5 wickets</p>
                  <p className="text-sm text-green-600">vs Epping CC</p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-sky-50 p-3 rounded-md border border-blue-100">
                  <p className="text-blue-800 font-medium">Michael Taylor took 3 catches</p>
                  <p className="text-sm text-blue-600">vs Brentwood CC</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}