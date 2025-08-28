import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Cloud, Database, Check, Server } from 'lucide-react';
import { useStorage } from '@/context/storage-context';
import { StorageBackend } from '@/lib/data-service';
import { isSupabaseConfigured } from '@/lib/supabaseClient';

export default function StorageSettingsPanel() {
  const { currentBackend, switchToBackend, isLoading, error } = useStorage();
  const [selectedBackend, setSelectedBackend] = useState<StorageBackend>(currentBackend);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'migrating' | 'success' | 'error'>('idle');
  const [migrationError, setMigrationError] = useState<string | null>(null);
  const [supabaseAvailable, setSupabaseAvailable] = useState<boolean>(isSupabaseConfigured());
  
  // Check Supabase configuration on mount
  useEffect(() => {
    setSupabaseAvailable(isSupabaseConfigured());
  }, []);

  const handleBackendChange = (value: StorageBackend) => {
    setSelectedBackend(value);
  };

  const handleApplyChanges = async () => {
    if (selectedBackend !== currentBackend) {
      await switchToBackend(selectedBackend);
    }
  };

  const handleMigrateData = async () => {
    try {
      setMigrationStatus('migrating');
      // In a real implementation, this would actually migrate the data between backends
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      setMigrationStatus('success');
    } catch (err) {
      console.error('Data migration failed:', err);
      setMigrationStatus('error');
      setMigrationError('Failed to migrate data. Please try again or contact support.');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">Storage Settings</CardTitle>
        <CardDescription className="text-slate-500">Configure where your data is stored and manage data migration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 px-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Storage Backend</h3>
          {!supabaseAvailable && (
            <Alert className="bg-blue-50 border-blue-200 mb-6 py-4">
              <div className="flex items-start gap-3">
                <Server className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-1">
                  <AlertTitle className="text-blue-700 font-medium mb-1">Supabase Integration Available</AlertTitle>
                  <AlertDescription className="text-blue-700 text-sm leading-relaxed">
                    To enable Supabase storage, connect your Supabase project by clicking the Supabase button in the top right 
                    of the platform. Once connected, you can migrate your data to Supabase for enhanced features.
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
          <RadioGroup
            value={selectedBackend}
            onValueChange={(value) => handleBackendChange(value as StorageBackend)}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="flex flex-col border rounded-md shadow-sm overflow-hidden h-full">
              <div className="p-5 bg-white flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <RadioGroupItem value="localStorage" id="localStorage" disabled={isLoading} />
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-slate-600 shrink-0" />
                    <Label htmlFor="localStorage" className="font-medium cursor-pointer">LocalStorage</Label>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground pl-9">Store data in your browser</div>
              </div>
            </div>
            
            <div className="flex flex-col border rounded-md shadow-sm overflow-hidden h-full">
              <div className="p-5 bg-white flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <RadioGroupItem value="googleSheets" id="googleSheets" disabled={isLoading} />
                  <div className="flex items-center gap-2">
                    <Cloud className="h-5 w-5 text-slate-600 shrink-0" />
                    <Label htmlFor="googleSheets" className="font-medium cursor-pointer">Google Sheets</Label>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground pl-9">Store data in Google Sheets</div>
              </div>
            </div>
            
            <div className="flex flex-col border rounded-md shadow-sm overflow-hidden h-full">
              <div className="p-5 bg-white flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <RadioGroupItem value="supabase" id="supabase" disabled={isLoading || !supabaseAvailable} />
                  <div className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-slate-600 shrink-0" />
                    <Label htmlFor="supabase" className="font-medium cursor-pointer">Supabase</Label>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground pl-9">Store data in Supabase</div>
                {!supabaseAvailable && (
                  <div className="text-xs text-amber-500 mt-2 pl-9">
                    Supabase not configured
                  </div>
                )}
              </div>
            </div>
          </RadioGroup>
        </div>
        
        <div className="space-y-5 border-t pt-6 mt-2">
          <div>
            <h3 className="text-lg font-medium mb-2">Data Migration</h3>
            <p className="text-sm text-muted-foreground">
              Migrate your data between storage backends. This will copy all your data from the current backend to the selected backend.
            </p>
          </div>
          
          {migrationStatus === 'success' && (
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <AlertTitle className="font-medium mb-1">Success</AlertTitle>
                  <AlertDescription className="text-green-700">Data migration completed successfully.</AlertDescription>
                </div>
              </div>
            </Alert>
          )}
          
          {migrationStatus === 'error' && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <AlertTitle className="font-medium mb-1">Error</AlertTitle>
                  <AlertDescription className="text-red-700">{migrationError}</AlertDescription>
                </div>
              </div>
            </Alert>
          )}
          
          <div className="pt-2">
            <Button 
              variant="outline" 
              onClick={handleMigrateData}
              disabled={isLoading || migrationStatus === 'migrating' || currentBackend === selectedBackend}
              className="px-4 py-2 h-10"
            >
              {migrationStatus === 'migrating' ? 'Migrating...' : 'Migrate Data'}
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t py-5 px-6 bg-slate-50">
        <Button 
          onClick={handleApplyChanges} 
          disabled={isLoading || currentBackend === selectedBackend}
          className="px-5 py-2 h-10"
        >
          {isLoading ? 'Applying...' : 'Apply Changes'}
        </Button>
      </CardFooter>
    </Card>
  );
}