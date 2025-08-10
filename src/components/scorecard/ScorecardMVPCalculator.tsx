import { useEffect, useState } from 'react';
import { MVPCalculator, convertScorecardToMVPFormat } from '../../lib/mvp-calculator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Upload, FileCheck2, Trophy, BarChart2, Save, Check, AlertCircle } from 'lucide-react';
import { ProcessedScorecardData } from '@/types/scorecard';
import { saveScorecardResults } from '@/lib/data-service';
import { useToast } from '@/components/ui/use-toast';

interface ScorecardMVPCalculatorProps {
  onProcessComplete?: (data: ProcessedScorecardData) => void;
}

export default function ScorecardMVPCalculator({ onProcessComplete }: ScorecardMVPCalculatorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processedData, setProcessedData] = useState<ProcessedScorecardData | null>(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { toast } = useToast();

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      setUploadedFile(file);
      setProcessingProgress(0);
      setProcessedData(null);
    }
  };

  // Process the scorecard (simulated)
  const processScorecard = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      // Simulate processing steps
      for (let progress = 0; progress <= 100; progress += 10) {
        setProcessingProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 200)); // Simulate processing time
      }

      // For demo purposes, we'll use our sample data from the JSON file
      // In a real implementation, this would parse the uploaded PDF file
      const sampleData = {
        match_info: {
          date: "Saturday 26th July 2025",
          competition: "Mid Essex Cricket League - Seventh Division 2025",
          result: "Brookweald CC - 2nd XI won",
          venue: "Add New Ground",
          team1: "Terling CC - 2nd XI",
          team2: "Brookweald CC - 2nd XI"
        },
        teams: {
          terling: {
            name: "Terling CC - 2nd XI",
            score: "239-7",
            overs: "45.0",
            points: "5"
          },
          brookweald: {
            name: "Brookweald CC - 2nd XI",
            score: "240-0",
            overs: "40.3",
            points: "24"
          }
        },
        players: {
          "Rob Harvey": {
            name: "Rob Harvey",
            team: "brookweald",
            is_captain: false,
            is_wicketkeeper: false,
            batting: {
              runs: 104,
              balls: 126,
              fours: 16,
              sixes: 0,
              status: "retired not out",
              strike_rate: 82.54
            },
            bowling: {},
            fielding: {
              catches: 0,
              stumpings: 0,
              run_outs: 0
            },
            mvp_points: 155
          },
          "Ryan Chapman": {
            name: "Ryan Chapman",
            team: "brookweald",
            is_captain: false,
            is_wicketkeeper: false,
            batting: {
              runs: 106,
              balls: 114,
              fours: 17,
              sixes: 0,
              status: "not out",
              strike_rate: 92.98
            },
            bowling: {},
            fielding: {
              catches: 0,
              stumpings: 0,
              run_outs: 0
            },
            mvp_points: 158
          },
          "Zafar Yasin": {
            name: "Zafar Yasin",
            team: "brookweald",
            is_captain: false,
            is_wicketkeeper: false,
            batting: {
              runs: 0,
              balls: 0,
              fours: 0,
              sixes: 0,
              status: "did not bat",
              strike_rate: 0
            },
            bowling: {
              overs: 9.0,
              maidens: 1,
              runs: 54,
              wickets: 3,
              wides: 2,
              no_balls: 0,
              economy: 6.0
            },
            fielding: {
              catches: 0,
              stumpings: 0,
              run_outs: 0
            },
            mvp_points: 75
          },
          "Anthony Hill": {
            name: "Anthony Hill",
            team: "brookweald",
            is_captain: false,
            is_wicketkeeper: false,
            batting: {
              runs: 0,
              balls: 0,
              fours: 0,
              sixes: 0,
              status: "did not bat",
              strike_rate: 0
            },
            bowling: {
              overs: 7.0,
              maidens: 1,
              runs: 26,
              wickets: 2,
              wides: 1,
              no_balls: 0,
              economy: 3.71
            },
            fielding: {
              catches: 0,
              stumpings: 0,
              run_outs: 0
            },
            mvp_points: 55
          },
          "Michael Larke": {
            name: "Michael Larke",
            team: "brookweald",
            is_captain: false,
            is_wicketkeeper: true,
            batting: {
              runs: 0,
              balls: 0,
              fours: 0,
              sixes: 0,
              status: "did not bat",
              strike_rate: 0
            },
            bowling: {},
            fielding: {
              catches: 2,
              stumpings: 1,
              run_outs: 0
            },
            mvp_points: 35
          }
        }
      };

      // Convert the data to our MVP format
      const mvpData = convertScorecardToMVPFormat(sampleData);
      setProcessedData(mvpData);

      // Call the callback if provided
      if (onProcessComplete) {
        onProcessComplete(mvpData);
      }

      // Switch to results tab
      setActiveTab('results');
    } catch (error) {
      console.error("Error processing scorecard:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle saving results to MVP data storage
  const saveToMVPStorage = async () => {
    if (!processedData) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      await saveScorecardResults(processedData);
      setSaveSuccess(true);
      toast({
        title: "Scorecard saved successfully",
        description: "Player performances have been added to the MVP database",
        variant: "default",
      });
    } catch (error) {
      console.error("Error saving scorecard data:", error);
      toast({
        title: "Failed to save scorecard",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (processedData) {
      // Reset save status when new data is processed
      setSaveSuccess(false);
    }
  }, [processedData]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" disabled={isProcessing}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Scorecard
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!processedData}>
            <Trophy className="w-4 h-4 mr-2" />
            MVP Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Scorecard PDF</CardTitle>
              <CardDescription>
                Upload a cricket scorecard PDF to calculate MVP points for all players.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="scorecard-file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isProcessing}
                />
                <label
                  htmlFor="scorecard-file"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="w-10 h-10 mb-2 text-gray-400" />
                  <span className="font-medium mb-1">
                    {uploadedFile ? uploadedFile.name : "Click to upload scorecard PDF"}
                  </span>
                  <span className="text-sm text-gray-500">
                    {uploadedFile ? `${(uploadedFile.size / 1024).toFixed(2)} KB` : "PDF files only"}
                  </span>
                </label>
              </div>

              {uploadedFile && (
                <>
                  <div className="flex items-center space-x-2">
                    <FileCheck2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium">File ready for processing</span>
                  </div>
                  <Button
                    onClick={processScorecard}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? "Processing..." : "Process Scorecard"}
                  </Button>
                </>
              )}

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing</span>
                    <span>{processingProgress}%</span>
                  </div>
                  <Progress value={processingProgress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {processedData && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Match Summary</CardTitle>
                  <CardDescription>
                    {processedData.match.date} | {processedData.match.competition}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium">{processedData.match.opposition}</h3>
                    </div>
                    <div>
                      <h3 className="font-medium">Brookweald CC</h3>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {processedData.match.matchResult}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>MVP Rankings</CardTitle>
                    <CardDescription>Top performers from the match</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={saveToMVPStorage} 
                      variant="outline" 
                      size="sm"
                      disabled={isSaving || saveSuccess}
                      className={saveSuccess ? "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" : ""}
                    >
                      {isSaving ? (
                        <span className="flex items-center gap-1">
                          <span className="animate-spin h-4 w-4 border-2 border-t-transparent rounded-full" />
                          Saving...
                        </span>
                      ) : saveSuccess ? (
                        <span className="flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          Saved to MVP
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Save className="w-4 h-4" />
                          Save to MVP
                        </span>
                      )}
                    </Button>
                    <BarChart2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {processedData.players.slice(0, 5).map((player, index: number) => (
                      <div key={index} className="flex items-center justify-between pb-2 border-b">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 
                                          ${index === 0 ? 'text-yellow-500' : 
                                            index === 1 ? 'text-gray-400' : 
                                              index === 2 ? 'text-amber-700' : ''}`}>
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium">{player.mvp.playerName}</h4>
                            <div className="flex gap-1 flex-wrap">
                              {player.mvp.specialAchievements.map((achievement: string, i: number) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {achievement}
                                </Badge>
                              ))}
                              {Object.entries(player.performance.role).map(([role, value]: [string, boolean]) => (
                                value && (
                                  <Badge key={role} variant="outline" className="text-xs">
                                    {role === 'isCaptain' ? 'Captain' : 
                                     role === 'isWicketkeeper' ? 'Wicketkeeper' : role}
                                  </Badge>
                                )
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold">{player.mvp.mvpPoints}</span>
                          <span className="text-sm text-muted-foreground ml-1">pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}