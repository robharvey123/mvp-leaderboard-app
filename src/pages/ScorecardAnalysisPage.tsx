import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import ScorecardMVPCalculator from '../components/scorecard/ScorecardMVPCalculator';
import { MVPPointsDistributionChart } from '../components/charts/MVPPointsDistributionChart';
import { CheckCircle, FileText, Info } from 'lucide-react';
import { ProcessedScorecardData } from '@/types/scorecard';

export default function ScorecardAnalysisPage() {
  const [processedData, setProcessedData] = useState<ProcessedScorecardData | null>(null);
  
  const handleProcessComplete = (data: ProcessedScorecardData) => {
    setProcessedData(data);
  };

  return (
    <>
      <Helmet>
        <title>Scorecard Analysis | Brookweald CC</title>
      </Helmet>
      
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-2">Scorecard Analysis</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Upload cricket scorecards to automatically calculate MVP points and analyze player performances
        </p>

        <div className="mb-6">
          <ScorecardMVPCalculator onProcessComplete={handleProcessComplete} />
        </div>

        {processedData && (
          <>
            <Separator className="my-6" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>MVP Points Breakdown</CardTitle>
                  <CardDescription>
                    How points are distributed across different aspects of the game
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MVPPointsDistributionChart data={processedData.players.slice(0, 5).map(player => ({
                    name: player.mvp.playerName,
                    batting: player.mvp.contributions.batting.points,
                    bowling: player.mvp.contributions.bowling.points,
                    fielding: player.mvp.contributions.fielding.points,
                    team: player.mvp.contributions.team.points
                  }))} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>MVP Calculation Method</CardTitle>
                  <CardDescription>
                    How player points are calculated in our system
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm space-y-4">
                  <div>
                    <h3 className="font-medium mb-1">Batting Points</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>1 point per run scored</li>
                      <li>1 additional point per boundary (four)</li>
                      <li>2 additional points per six</li>
                      <li>10 bonus points for not out/retired not out</li>
                      <li>10 bonus points for a half-century (50+ runs)</li>
                      <li>25 bonus points for a century (100+ runs)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-1">Bowling Points</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>20 points per wicket taken</li>
                      <li>5 points per maiden over</li>
                      <li>10 bonus points for 3+ wickets in a match</li>
                      <li>25 bonus points for 5+ wickets in a match</li>
                      <li>Economy rate bonus (if 3+ overs bowled):
                        <ul className="list-disc pl-5">
                          <li>20 points for economy under 3.0</li>
                          <li>10 points for economy under 4.5</li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-1">Fielding Points</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>10 points per catch</li>
                      <li>15 points per stumping</li>
                      <li>10 points per run out</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-1">Team Contribution</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>10 bonus points for captain if team wins</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>How to Use</CardTitle>
                  <CardDescription>Guide to using the scorecard analysis feature</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <FileText className="w-6 h-6 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-medium">1. Upload Scorecard</h3>
                        <p className="text-sm text-muted-foreground">
                          Upload a PDF scorecard from play-cricket.com or any other supported cricket scoring platform
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-medium">2. Verify Results</h3>
                        <p className="text-sm text-muted-foreground">
                          Our AI will extract all relevant player data and calculate MVP points automatically
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Info className="w-6 h-6 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-medium">3. Add to Leaderboard</h3>
                        <p className="text-sm text-muted-foreground">
                          Save the processed data to add these performances to the overall club MVP leaderboard
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </>
  );
}