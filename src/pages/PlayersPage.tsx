import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function PlayersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Brookweald CC Players</h1>
      
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search players..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* This would be populated with actual player data */}
        <Card>
          <CardHeader>
            <CardTitle>Example Player</CardTitle>
            <CardDescription>Batsman</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <p>
                <span className="font-semibold">MVP Points:</span> 123
              </p>
              <p>
                <span className="font-semibold">Matches:</span> 5
              </p>
              <div className="mt-4">
                <Link to="/players/example-id">
                  <Button variant="outline">View Profile</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-dashed border-2 flex flex-col items-center justify-center p-6">
          <p className="text-muted-foreground text-center mb-4">
            Player data will be displayed here when connected to data service.
          </p>
        </Card>
      </div>
    </div>
  );
}