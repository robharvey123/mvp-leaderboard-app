import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initializeDataService, getCurrentBackend, switchBackend, StorageBackend } from '@/lib/data-service';

interface StorageContextType {
  currentBackend: StorageBackend;
  switchToBackend: (backend: StorageBackend) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export function StorageProvider({ children }: { children: ReactNode }) {
  const [currentBackend, setCurrentBackend] = useState<StorageBackend>('localStorage');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initStorage = async () => {
      try {
        setIsLoading(true);
        await initializeDataService();
        setCurrentBackend(getCurrentBackend());
        setError(null);
      } catch (err) {
        console.error('Failed to initialize data service:', err);
        setError('Failed to initialize data storage. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    initStorage();
  }, []);

  const switchToBackend = async (backend: StorageBackend) => {
    try {
      setIsLoading(true);
      await switchBackend(backend);
      setCurrentBackend(getCurrentBackend());
      setError(null);
    } catch (err) {
      console.error(`Failed to switch to ${backend} backend:`, err);
      setError(`Failed to switch to ${backend} storage. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StorageContext.Provider value={{ currentBackend, switchToBackend, isLoading, error }}>
      {children}
    </StorageContext.Provider>
  );
}

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};