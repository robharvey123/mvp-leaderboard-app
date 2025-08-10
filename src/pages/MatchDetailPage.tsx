import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function MatchDetailPage() {
  const { matchId } = useParams();
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Match Details</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Match Information</CardTitle>
          <CardDescription>Summary and key details</CardDescription>
        </CardHeader>
        <CardContent>
          <h2 className="text-xl font-semibold">Match ID: {matchId}</h2>
          <p className="text-muted-foreground mt-2">
            Match details will be displayed here when connected to data service.
          </p>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="scorecard">
        <TabsList className="mb-4">
          <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
          <TabsTrigger value="performances">Performances</TabsTrigger>
          <TabsTrigger value="mvp">MVP Points</TabsTrigger>
        </TabsList>
        
        <TabsContent value="scorecard">
          <Card>
            <CardHeader>
              <CardTitle>Match Scorecard</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  Scorecard will be displayed when connected to data service.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performances">
          <Card>
            <CardHeader>
              <CardTitle>Player Performances</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  Performance details will be displayed when connected to data service.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="mvp">
          <Card>
            <CardHeader>
              <CardTitle>MVP Point Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  MVP points will be displayed when connected to data service.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}