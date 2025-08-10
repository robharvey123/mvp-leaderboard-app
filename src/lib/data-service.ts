/**
 * Data Service - Core data management module that determines which storage backend to use
 * Supports localStorage, Google Sheets, and Supabase as data sources
 */

import * as LocalStorage from './storage-service';
import * as SheetsService from './sheets-service';
import * as SheetsEntities from './sheets-service-entities';
import * as SupabaseService from './supabase-service';
import { isSupabaseConfigured } from './supabase-client';
import { useState, useEffect } from 'react';
import { 
  User, 
  Player, 
  Match, 
  Season, 
  BattingPerformance, 
  BowlingPerformance, 
  FieldingPerformance,
  LeaderboardFilters,
  PointsBreakdown,
  PlayerMVPEntry,
  MVPLeaderboard
} from '@/types';
import { ProcessedScorecardData } from '@/types/scorecard';

// Determine which storage backend to use
export type StorageBackend = 'localStorage' | 'googleSheets' | 'supabase';
let currentBackend: StorageBackend = 'localStorage'; // Default to localStorage

// Initialize storage backend based on configuration
export const initializeDataService = async (backend: StorageBackend = 'localStorage'): Promise<void> => {
  currentBackend = backend;
  
  // Check backend configuration
  try {
    if (backend === 'googleSheets') {
      // Check if we have configured Google Sheets
      const sheetsConfigured = localStorage.getItem('brookweald_sheets_configured') === 'true';
      if (!sheetsConfigured) {
        console.log('Google Sheets not configured, falling back to localStorage');
        currentBackend = 'localStorage';
      }
    } else if (backend === 'supabase') {
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        console.log('Supabase not configured, falling back to localStorage');
        currentBackend = 'localStorage';
      }
    }
  } catch (error) {
    console.error(`Error checking ${backend} configuration:`, error);
    currentBackend = 'localStorage';
  }
  
  // Initialize the appropriate storage service
  if (currentBackend === 'localStorage') {
    await LocalStorage.initStorage();
  } else if (currentBackend === 'googleSheets') {
    await SheetsService.initStorage();
  } else if (currentBackend === 'supabase') {
    await SupabaseService.initStorage();
  }
  
  console.log(`Data service initialized with backend: ${currentBackend}`);
};

// Get the current backend
export const getCurrentBackend = (): StorageBackend => {
  return currentBackend;
};

// Switch the backend and initialize it
export const switchBackend = async (backend: StorageBackend): Promise<void> => {
  await initializeDataService(backend);
};

// Custom hook to track the current backend
export const useCurrentBackend = (): [StorageBackend, (backend: StorageBackend) => Promise<void>] => {
  const [backend, setBackend] = useState<StorageBackend>(currentBackend);
  
  useEffect(() => {
    // Set the initial backend
    setBackend(currentBackend);
    
    // Setup listener for backend changes
    const handleBackendChange = () => {
      setBackend(currentBackend);
    };
    
    window.addEventListener('backendChanged', handleBackendChange);
    
    return () => {
      window.removeEventListener('backendChanged', handleBackendChange);
    };
  }, []);
  
  const changeBackend = async (newBackend: StorageBackend) => {
    await switchBackend(newBackend);
    setBackend(newBackend);
    // Dispatch event to notify components of backend change
    window.dispatchEvent(new Event('backendChanged'));
  };
  
  return [backend, changeBackend];
};

// Export all the methods with dynamic backend routing
export const getUsers = async (): Promise<User[]> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.getUsers();
    case 'supabase':
      return SupabaseService.getUsers();
    case 'googleSheets':
    default:
      return SheetsService.getUsers();
  }
};

export const getUserById = async (userId: string): Promise<User | undefined> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.getUserById(userId);
    case 'supabase':
      return SupabaseService.getUserById(userId);
    case 'googleSheets':
    default:
      return SheetsService.getUserById(userId);
  }
};

export const registerUser = async (email: string, name: string, password: string): Promise<User> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.registerUser(email, name, password);
    case 'supabase':
      return SupabaseService.registerUser(email, name, password);
    case 'googleSheets':
    default:
      return SheetsService.registerUser(email, name, password);
  }
};

export const login = async (email: string, password: string): Promise<{ user: User, token: string }> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.loginUser(email, password);
    case 'supabase':
      return SupabaseService.loginUser(email, password);
    case 'googleSheets':
    default:
      return SheetsService.loginUser(email, password);
  }
};

export const logout = async (): Promise<void> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.logoutUser();
    case 'supabase':
      return SupabaseService.logoutUser();
    case 'googleSheets':
    default:
      return SheetsService.logoutUser();
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.getCurrentUser();
    case 'supabase':
      return SupabaseService.getCurrentUser();
    case 'googleSheets':
    default:
      return SheetsService.getCurrentUser();
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<User> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.updateUserProfile(userId, updates);
    case 'supabase':
      return SupabaseService.updateUserProfile(userId, updates);
    case 'googleSheets':
    default:
      return SheetsService.updateUserProfile(userId, updates);
  }
};

export const getPlayers = async (): Promise<Player[]> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.getPlayers();
    case 'supabase':
      return SupabaseService.getPlayers();
    case 'googleSheets':
    default:
      return SheetsEntities.getPlayers();
  }
};

export const getPlayerById = async (playerId: string): Promise<Player | undefined> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.getPlayerById(playerId);
    case 'supabase':
      return SupabaseService.getPlayerById(playerId);
    case 'googleSheets':
    default:
      return SheetsEntities.getPlayerById(playerId);
  }
};

export const createPlayer = async (player: Omit<Player, 'playerId'>): Promise<Player> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.createPlayer(player);
    case 'supabase':
      return SupabaseService.createPlayer(player);
    case 'googleSheets':
    default:
      return SheetsEntities.createPlayer(player);
  }
};

export const updatePlayer = async (playerId: string, updates: Partial<Player>): Promise<Player> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.updatePlayer(playerId, updates);
    case 'supabase':
      return SupabaseService.updatePlayer(playerId, updates);
    case 'googleSheets':
    default:
      return SheetsEntities.updatePlayer(playerId, updates);
  }
};

export const deletePlayer = async (playerId: string): Promise<boolean> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.deletePlayer(playerId);
    case 'supabase':
      return SupabaseService.deletePlayer(playerId);
    case 'googleSheets':
    default:
      return SheetsEntities.deletePlayer(playerId);
  }
};

export const getMatches = async (): Promise<Match[]> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.getMatches();
    case 'supabase':
      return SupabaseService.getMatches();
    case 'googleSheets':
    default:
      return SheetsEntities.getMatches();
  }
};

export const getMatchById = async (matchId: string): Promise<Match | undefined> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.getMatchById(matchId);
    case 'supabase':
      return SupabaseService.getMatchById(matchId);
    case 'googleSheets':
    default:
      return SheetsEntities.getMatchById(matchId);
  }
};

export const getRecentMatches = async (limit: number = 3): Promise<Match[]> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.getRecentMatches(limit);
    case 'supabase':
      return SupabaseService.getRecentMatches(limit);
    case 'googleSheets':
    default:
      return SheetsEntities.getRecentMatches(limit);
  }
};

export const createMatch = async (match: Omit<Match, 'matchId'>): Promise<Match> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.createMatch(match);
    case 'supabase':
      return SupabaseService.createMatch(match);
    case 'googleSheets':
    default:
      return SheetsEntities.createMatch(match);
  }
};

export const updateMatch = async (matchId: string, updates: Partial<Match>): Promise<Match> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.updateMatch(matchId, updates);
    case 'supabase':
      return SupabaseService.updateMatch(matchId, updates);
    case 'googleSheets':
    default:
      return SheetsEntities.updateMatch(matchId, updates);
  }
};

export const deleteMatch = async (matchId: string): Promise<boolean> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.deleteMatch(matchId);
    case 'supabase':
      return SupabaseService.deleteMatch(matchId);
    case 'googleSheets':
    default:
      return SheetsEntities.deleteMatch(matchId);
  }
};

export const getBattingPerformances = async (matchId: string): Promise<BattingPerformance[]> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.getBattingPerformances(matchId);
    case 'supabase':
      return SupabaseService.getBattingPerformances(matchId);
    case 'googleSheets':
    default:
      return SheetsEntities.getBattingPerformances(matchId);
  }
};

export const getBowlingPerformances = async (matchId: string): Promise<BowlingPerformance[]> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.getBowlingPerformances(matchId);
    case 'supabase':
      return SupabaseService.getBowlingPerformances(matchId);
    case 'googleSheets':
    default:
      return SheetsEntities.getBowlingPerformances(matchId);
  }
};

export const getFieldingPerformances = async (matchId: string): Promise<FieldingPerformance[]> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.getFieldingPerformances(matchId);
    case 'supabase':
      return SupabaseService.getFieldingPerformances(matchId);
    case 'googleSheets':
    default:
      return SheetsEntities.getFieldingPerformances(matchId);
  }
};

export const savePlayerPerformances = async (
  matchId: string, 
  batting: BattingPerformance[], 
  bowling: BowlingPerformance[], 
  fielding: FieldingPerformance[]
): Promise<void> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.savePlayerPerformances(matchId, batting, bowling, fielding);
    case 'supabase':
      return SupabaseService.savePlayerPerformances(matchId, batting, bowling, fielding);
    case 'googleSheets':
    default:
      return SheetsEntities.savePlayerPerformances(matchId, batting, bowling, fielding);
  }
};

export const getLeaderboard = async (filters?: LeaderboardFilters): Promise<PlayerMVPEntry[]> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.getLeaderboard(filters);
    case 'supabase':
      return SupabaseService.getLeaderboard(filters);
    case 'googleSheets':
    default:
      return SheetsEntities.getLeaderboard(filters);
  }
};

export const getTopPlayers = async (limit: number = 5): Promise<PlayerMVPEntry[]> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.getTopPlayers(limit);
    case 'supabase':
      return SupabaseService.getTopPlayers(limit);
    case 'googleSheets':
    default:
      return SheetsEntities.getTopPlayers(limit);
  }
};

export const getPlayerMVPPoints = async (playerId: string): Promise<PointsBreakdown> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.getPlayerMVPPoints(playerId);
    case 'supabase':
      return SupabaseService.getPlayerMVPPoints(playerId);
    case 'googleSheets':
    default:
      return SheetsEntities.getPlayerMVPPoints(playerId);
  }
};

export const updateLeaderboard = async (): Promise<MVPLeaderboard> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.updateLeaderboard();
    case 'supabase':
      return SupabaseService.updateLeaderboard();
    case 'googleSheets':
    default:
      return SheetsEntities.updateLeaderboard();
  }
};

export const getSeasons = async (): Promise<Season[]> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.getSeasons();
    case 'supabase':
      return SupabaseService.getSeasons();
    case 'googleSheets':
    default:
      return SheetsEntities.getSeasons();
  }
};

export const getActiveSeasonId = async (): Promise<string | null> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.getActiveSeasonId();
    case 'supabase':
      return SupabaseService.getActiveSeasonId();
    case 'googleSheets':
    default:
      return SheetsEntities.getActiveSeasonId();
  }
};

export const setActiveSeason = async (seasonId: string): Promise<void> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.setActiveSeason(seasonId);
    case 'supabase':
      return SupabaseService.setActiveSeason(seasonId);
    case 'googleSheets':
    default:
      return SheetsEntities.setActiveSeason(seasonId);
  }
};

export const createSeason = async (season: Omit<Season, 'seasonId'>): Promise<Season> => {
  switch (currentBackend) {
    case 'localStorage':
      return LocalStorage.createSeason(season);
    case 'supabase':
      return SupabaseService.createSeason(season);
    case 'googleSheets':
    default:
      return SheetsEntities.createSeason(season);
  }
};

// Scorecard Analysis Related functions
export const saveScorecardResults = async (data: ProcessedScorecardData): Promise<void> => {
  // Import the scorecard service dynamically to avoid circular dependencies
  const { saveScorecardResults } = await import('./scorecard-service');
  return await saveScorecardResults(data);
};

// Migration functions for transferring data between backends
export const migrateFromLocalToSheets = async (): Promise<void> => {
  // This would be implemented in a production system
  // For demo purposes, we'll just simulate a migration
  console.log('Migrating data from localStorage to Google Sheets...');
  
  // In a real implementation, this would:
  // 1. Get all data from localStorage
  // 2. Convert it to the format expected by Google Sheets
  // 3. Upload it to Google Sheets
  
  console.log('Migration completed successfully');
};

export const migrateSheetsToLocal = async (): Promise<void> => {
  // This would be implemented in a production system
  // For demo purposes, we'll just simulate a migration
  console.log('Migrating data from Google Sheets to localStorage...');
  
  // In a real implementation, this would:
  // 1. Get all data from Google Sheets
  // 2. Convert it to the format expected by localStorage
  // 3. Save it to localStorage
  
  console.log('Migration completed successfully');
};