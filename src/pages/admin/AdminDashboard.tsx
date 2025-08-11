import SupabaseStatus from "../../components/SupabaseStatus";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import StorageSettingsPanel from "../../components/admin/StorageSettingsPanel";

export default function AdminDashboard() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Link to="/"><Button>Back to site</Button></Link>
      </div>

      <div className="mt-2">
        <SupabaseStatus />
      </div>

      <Tabs defaultValue="overview" className="mt-4">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Getting started</CardTitle>
              <CardDescription>Quick links and status.</CardDescription>
            </CardHeader>
            <CardContent className="space-x-3">
              <Link to="/leaderboard"><Button variant="secondary">View Leaderboard</Button></Link>
              <Link to="/matches"><Button variant="secondary">View Matches</Button></Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="players">
          <Card><CardContent>TODO: player management</CardContent></Card>
        </TabsContent>

        <TabsContent value="matches">
          <Card><CardContent>TODO: match management</CardContent></Card>
        </TabsContent>

        <TabsContent value="settings">
          <StorageSettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
