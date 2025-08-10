import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function MatchesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Brookweald CC Matches</h1>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Search matches..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter matches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Matches</SelectItem>
            <SelectItem value="recent">Recent Matches</SelectItem>
            <SelectItem value="upcoming">Upcoming Matches</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-6">
        {/* This would be populated with actual match data */}
        <Card>
          <CardHeader>
            <CardTitle>Example Match</CardTitle>
            <CardDescription>vs Example Opponent - June 15, 2024</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <p>
                <span className="font-semibold">Result:</span> Won by 5 wickets
              </p>
              <p>
                <span className="font-semibold">Location:</span> Home Ground
              </p>
              <div className="mt-4">
                <Link to="/matches/example-id">
                  <Button variant="outline">View Match Details</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-dashed border-2 flex flex-col items-center justify-center p-6">
          <p className="text-muted-foreground text-center mb-4">
            Match data will be displayed here when connected to data service.
          </p>
        </Card>
      </div>
    </div>
  );
}