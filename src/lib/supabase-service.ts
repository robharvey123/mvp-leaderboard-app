/**
 * Supabase Service - Implementation of data storage using Supabase
 */

import { v4 as uuidv4 } from 'uuid';
import { getSupabaseClient, isSupabaseConfigured } from './supabase-client';
import { MVPCalculator } from './mvp-calculator';

import { 
  User, 
  Player, 
  Season,
  Match,
  BattingPerformance, 
  BowlingPerformance, 
  FieldingPerformance,
  SpecialDesignation,
  LeaderboardFilters,
  PlayerMVPEntry,
  PointsBreakdown,
  MVPLeaderboard
} from '@/types';

// Table names in Supabase
const TABLES = {
  USERS: 'users',
  PLAYERS: 'players',
  SEASONS: 'seasons',
  MATCHES: 'matches',
  BATTING_PERFORMANCES: 'batting_performances',
  BOWLING_PERFORMANCES: 'bowling_performances',
  FIELDING_PERFORMANCES: 'fielding_performances',
  SPECIAL_DESIGNATIONS: 'special_designations',
  MVP_LEADERBOARDS: 'mvp_leaderboards',
  MVP_ENTRIES: 'mvp_entries',
  APP_SETTINGS: 'app_settings'
};

// Initialize storage with required tables
export const initStorage = async (): Promise<void> => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please set URL and API key in storage settings.');
  }
  
  console.log('Initializing Supabase storage...');
  
  // Note: Table creation is typically handled via migrations in Supabase
  // This is just a check to make sure tables exist and have data
  
  try {
    const supabase = getSupabaseClient();
    
    // Check if we have an active season
    const { data: seasons } = await supabase
      .from(TABLES.SEASONS)
      .select('seasonId')
      .eq('isActive', true)
      .limit(1);
      
    // If no active season, create a default one
    if (!seasons || seasons.length === 0) {
      const defaultSeason = {
        seasonId: uuidv4(),
        name: '2025 Season',
        startDate: new Date().toISOString(),
        endDate: new Date(new Date().getFullYear() + 1, 0, 1).toISOString(),
        isActive: true
      };
      
      await supabase
        .from(TABLES.SEASONS)
        .insert(defaultSeason);
        
      console.log('Created default season in Supabase');
    }
    
    // Check if we have any users
    const { data: users } = await supabase
      .from(TABLES.USERS)
      .select('userId')
      .limit(1);
      
    // If no users, create a default admin
    if (!users || users.length === 0) {
      const defaultAdmin = {
        userId: uuidv4(),
        email: 'admin@brookwealdcc.com',
        name: 'Admin User',
        role: 'admin',
        passwordHash: 'adminpass123', // This should be properly hashed in a real app
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      
      await supabase
        .from(TABLES.USERS)
        .insert(defaultAdmin);
        
      console.log('Created default admin user in Supabase');
    }
    
    console.log('Supabase storage initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Supabase storage:', error);
    throw new Error('Failed to initialize Supabase storage. Please check your configuration.');
  }
};

// User management functions
export const getUsers = async (): Promise<User[]> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLES.USERS)
    .select('*');
    
  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
  
  return data || [];
};

export const getUserById = async (userId: string): Promise<User | undefined> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLES.USERS)
    .select('*')
    .eq('userId', userId)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') { // Record not found
      return undefined;
    }
    console.error('Error fetching user by ID:', error);
    throw error;
  }
  
  return data;
};

export const registerUser = async (email: string, name: string, password: string): Promise<User> => {
  // Check if user with this email already exists
  const supabase = getSupabaseClient();
  const { data: existingUsers } = await supabase
    .from(TABLES.USERS)
    .select('userId')
    .eq('email', email);
    
  if (existingUsers && existingUsers.length > 0) {
    throw new Error('A user with this email already exists');
  }
  
  // Create new user
  const newUser: User = {
    userId: uuidv4(),
    email,
    name,
    role: 'public', // Default role for new users
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    passwordHash: password // In a real app, this would be properly hashed
  };
  
  const { error } = await supabase
    .from(TABLES.USERS)
    .insert(newUser);
    
  if (error) {
    console.error('Error registering user:', error);
    throw error;
  }
  
  return newUser;
};

export const loginUser = async (email: string, password: string): Promise<{ user: User, token: string }> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLES.USERS)
    .select('*')
    .eq('email', email)
    .single();
    
  if (error || !data) {
    throw new Error('Invalid email or password');
  }
  
  const user = data as User;
  
  // In a real app, we would properly verify the password hash
  if (user.passwordHash !== password) {
    throw new Error('Invalid email or password');
  }
  
  // Update last login time
  await supabase
    .from(TABLES.USERS)
    .update({ lastLogin: new Date().toISOString() })
    .eq('userId', user.userId);
    
  // Generate a token (in a real app, this would use JWT or similar)
  const token = 'mock-jwt-token-' + uuidv4();
  
  // Store auth info in localStorage for persistence
  localStorage.setItem('brookweald_auth_user', JSON.stringify(user));
  localStorage.setItem('brookweald_auth_token', token);
  
  return { user, token };
};

export const logoutUser = async (): Promise<void> => {
  localStorage.removeItem('brookweald_auth_user');
  localStorage.removeItem('brookweald_auth_token');
};

export const getCurrentUser = async (): Promise<User | null> => {
  const userJson = localStorage.getItem('brookweald_auth_user');
  if (!userJson) {
    return null;
  }
  
  try {
    return JSON.parse(userJson) as User;
  } catch (e) {
    console.error('Error parsing current user from localStorage:', e);
    return null;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<User> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLES.USERS)
    .update(updates)
    .eq('userId', userId)
    .select('*')
    .single();
    
  if (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
  
  // Update local storage if this is the current user
  const currentUserJson = localStorage.getItem('brookweald_auth_user');
  if (currentUserJson) {
    try {
      const currentUser = JSON.parse(currentUserJson);
      if (currentUser.userId === userId) {
        localStorage.setItem('brookweald_auth_user', JSON.stringify(data));
      }
    } catch (e) {
      console.error('Error updating current user in localStorage:', e);
    }
  }
  
  return data as User;
};

// Player management functions
export const getPlayers = async (): Promise<Player[]> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLES.PLAYERS)
    .select('*');
    
  if (error) {
    console.error('Error fetching players:', error);
    throw error;
  }
  
  return data || [];
};

export const getPlayerById = async (playerId: string): Promise<Player | undefined> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLES.PLAYERS)
    .select('*')
    .eq('playerId', playerId)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') { // Record not found
      return undefined;
    }
    console.error('Error fetching player by ID:', error);
    throw error;
  }
  
  return data;
};

export const createPlayer = async (player: Omit<Player, 'playerId'>): Promise<Player> => {
  const newPlayer: Player = {
    ...player,
    playerId: uuidv4()
  };
  
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from(TABLES.PLAYERS)
    .insert(newPlayer);
    
  if (error) {
    console.error('Error creating player:', error);
    throw error;
  }
  
  return newPlayer;
};

export const updatePlayer = async (playerId: string, updates: Partial<Player>): Promise<Player> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLES.PLAYERS)
    .update(updates)
    .eq('playerId', playerId)
    .select('*')
    .single();
    
  if (error) {
    console.error('Error updating player:', error);
    throw error;
  }
  
  return data as Player;
};

export const deletePlayer = async (playerId: string): Promise<boolean> => {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from(TABLES.PLAYERS)
    .delete()
    .eq('playerId', playerId);
    
  if (error) {
    console.error('Error deleting player:', error);
    throw error;
  }
  
  return true;
};

// Match management functions
export const getMatches = async (): Promise<Match[]> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLES.MATCHES)
    .select('*');
    
  if (error) {
    console.error('Error fetching matches:', error);
    throw error;
  }
  
  return data || [];
};

export const getMatchById = async (matchId: string): Promise<Match | undefined> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLES.MATCHES)
    .select('*')
    .eq('matchId', matchId)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') { // Record not found
      return undefined;
    }
    console.error('Error fetching match by ID:', error);
    throw error;
  }
  
  return data;
};

export const getRecentMatches = async (limit: number = 3): Promise<Match[]> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLES.MATCHES)
    .select('*')
    .order('matchDate', { ascending: false })
    .limit(limit);
    
  if (error) {
    console.error('Error fetching recent matches:', error);
    throw error;
  }
  
  return data || [];
};

export const createMatch = async (match: Omit<Match, 'matchId'>): Promise<Match> => {
  const newMatch: Match = {
    ...match,
    matchId: uuidv4()
  };
  
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from(TABLES.MATCHES)
    .insert(newMatch);
    
  if (error) {
    console.error('Error creating match:', error);
    throw error;
  }
  
  return newMatch;
};

export const updateMatch = async (matchId: string, updates: Partial<Match>): Promise<Match> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLES.MATCHES)
    .update(updates)
    .eq('matchId', matchId)
    .select('*')
    .single();
    
  if (error) {
    console.error('Error updating match:', error);
    throw error;
  }
  
  return data as Match;
};

export const deleteMatch = async (matchId: string): Promise<boolean> => {
  // Delete all related performance records first
  const supabase = getSupabaseClient();
  
  try {
    // Delete batting performances
    await supabase
      .from(TABLES.BATTING_PERFORMANCES)
      .delete()
      .eq('matchId', matchId);
      
    // Delete bowling performances
    await supabase
      .from(TABLES.BOWLING_PERFORMANCES)
      .delete()
      .eq('matchId', matchId);
      
    // Delete fielding performances
    await supabase
      .from(TABLES.FIELDING_PERFORMANCES)
      .delete()
      .eq('matchId', matchId);
      
    // Delete special designations
    await supabase
      .from(TABLES.SPECIAL_DESIGNATIONS)
      .delete()
      .eq('matchId', matchId);
      
    // Delete match
    const { error } = await supabase
      .from(TABLES.MATCHES)
      .delete()
      .eq('matchId', matchId);
      
    if (error) {
      console.error('Error deleting match:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in cascading match deletion:', error);
    throw error;
  }
};

// Performance management functions
export const getBattingPerformances = async (matchId: string): Promise<BattingPerformance[]> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLES.BATTING_PERFORMANCES)
    .select('*')
    .eq('matchId', matchId);
    
  if (error) {
    console.error('Error fetching batting performances:', error);
    throw error;
  }
  
  return data || [];
};

export const getBowlingPerformances = async (matchId: string): Promise<BowlingPerformance[]> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLES.BOWLING_PERFORMANCES)
    .select('*')
    .eq('matchId', matchId);
    
  if (error) {
    console.error('Error fetching bowling performances:', error);
    throw error;
  }
  
  return data || [];
};

export const getFieldingPerformances = async (matchId: string): Promise<FieldingPerformance[]> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLES.FIELDING_PERFORMANCES)
    .select('*')
    .eq('matchId', matchId);
    
  if (error) {
    console.error('Error fetching fielding performances:', error);
    throw error;
  }
  
  return data || [];
};

export const savePlayerPerformances = async (
  matchId: string, 
  batting: BattingPerformance[], 
  bowling: BowlingPerformance[], 
  fielding: FieldingPerformance[]
): Promise<void> => {
  const supabase = getSupabaseClient();
  
  try {
    // Start by deleting existing performances for this match
    await supabase.from(TABLES.BATTING_PERFORMANCES).delete().eq('matchId', matchId);
    await supabase.from(TABLES.BOWLING_PERFORMANCES).delete().eq('matchId', matchId);
    await supabase.from(TABLES.FIELDING_PERFORMANCES).delete().eq('matchId', matchId);
    
    // Calculate MVP points for each performance
    const battingWithPoints = batting.map(perf => {
      const mvpResult = MVPCalculator.calculateMVP({
        ...perf,
        batting: perf
      });
      return {
        ...perf,
        mvpPoints: mvpResult.contributions.batting.points || 0
      };
    });
    
    const bowlingWithPoints = bowling.map(perf => {
      const mvpResult = MVPCalculator.calculateMVP({
        ...perf,
        bowling: perf
      });
      return {
        ...perf,
        mvpPoints: mvpResult.contributions.bowling.points || 0
      };
    });
    
    const fieldingWithPoints = fielding.map(perf => {
      const mvpResult = MVPCalculator.calculateMVP({
        ...perf,
        fielding: perf
      });
      return {
        ...perf,
        mvpPoints: mvpResult.contributions.fielding.points || 0
      };
    });
    
    // Insert new performances
    if (battingWithPoints.length > 0) {
      const { error: battingError } = await supabase
        .from(TABLES.BATTING_PERFORMANCES)
        .insert(battingWithPoints);
        
      if (battingError) throw battingError;
    }
    
    if (bowlingWithPoints.length > 0) {
      const { error: bowlingError } = await supabase
        .from(TABLES.BOWLING_PERFORMANCES)
        .insert(bowlingWithPoints);
        
      if (bowlingError) throw bowlingError;
    }
    
    if (fieldingWithPoints.length > 0) {
      const { error: fieldingError } = await supabase
        .from(TABLES.FIELDING_PERFORMANCES)
        .insert(fieldingWithPoints);
        
      if (fieldingError) throw fieldingError;
    }
    
    // Update match to mark it as complete
    await supabase
      .from(TABLES.MATCHES)
      .update({ isComplete: true })
      .eq('matchId', matchId);
      
  } catch (error) {
    console.error('Error saving player performances:', error);
    throw error;
  }
};

// Leaderboard and MVP functions
export const getLeaderboard = async (filters?: LeaderboardFilters): Promise<PlayerMVPEntry[]> => {
  // For a real implementation, this would query the MVP_ENTRIES table
  // and apply filters as needed. For simplicity, we'll calculate it on the fly.
  try {
    // First get all players
    const players = await getPlayers();
    
    // Create empty leaderboard entries
    const leaderboard: PlayerMVPEntry[] = [];
    
    // For each player, calculate their MVP points
    for (const player of players) {
      if (!player.isActive && !filters?.playerId) continue;
      
      if (filters?.playerId && filters.playerId !== player.playerId) continue;
      
      const points = await getPlayerMVPPoints(player.playerId);
      
      leaderboard.push({
        entryId: uuidv4(),
        leaderboardId: 'current', // This is just a placeholder
        playerId: player.playerId,
        playerName: `${player.firstName} ${player.lastName}`,
        totalMVPPoints: points.total,
        battingPoints: points.batting,
        bowlingPoints: points.bowling,
        fieldingPoints: points.fielding,
        teamPoints: points.team,
        specialPoints: points.special
      });
    }
    
    // Sort the leaderboard by total points
    leaderboard.sort((a, b) => b.totalMVPPoints - a.totalMVPPoints);
    
    // Apply limit if specified
    if (filters?.limit && filters.limit > 0) {
      return leaderboard.slice(0, filters.limit);
    }
    
    return leaderboard;
  } catch (error) {
    console.error('Error generating leaderboard:', error);
    throw error;
  }
};

export const getTopPlayers = async (limit: number = 5): Promise<PlayerMVPEntry[]> => {
  return getLeaderboard({ limit });
};

export const getPlayerMVPPoints = async (playerId: string): Promise<PointsBreakdown> => {
  const supabase = getSupabaseClient();
  
  try {
    // Get all batting performances for this player
    const { data: battingData, error: battingError } = await supabase
      .from(TABLES.BATTING_PERFORMANCES)
      .select('mvpPoints')
      .eq('playerId', playerId);
      
    if (battingError) throw battingError;
    
    // Get all bowling performances for this player
    const { data: bowlingData, error: bowlingError } = await supabase
      .from(TABLES.BOWLING_PERFORMANCES)
      .select('mvpPoints')
      .eq('playerId', playerId);
      
    if (bowlingError) throw bowlingError;
    
    // Get all fielding performances for this player
    const { data: fieldingData, error: fieldingError } = await supabase
      .from(TABLES.FIELDING_PERFORMANCES)
      .select('mvpPoints')
      .eq('playerId', playerId);
      
    if (fieldingError) throw fieldingError;
    
    // Get all special designations for this player
    const { data: specialData, error: specialError } = await supabase
      .from(TABLES.SPECIAL_DESIGNATIONS)
      .select('pointsImpact')
      .eq('playerId', playerId);
      
    if (specialError) throw specialError;
    
    // Sum up all points
    const battingPoints = battingData?.reduce((sum, item) => sum + item.mvpPoints, 0) || 0;
    const bowlingPoints = bowlingData?.reduce((sum, item) => sum + item.mvpPoints, 0) || 0;
    const fieldingPoints = fieldingData?.reduce((sum, item) => sum + item.mvpPoints, 0) || 0;
    const specialPoints = specialData?.reduce((sum, item) => sum + item.pointsImpact, 0) || 0;
    
    // For now, team points are not tracked separately in Supabase
    const teamPoints = 0;
    
    return {
      batting: battingPoints,
      bowling: bowlingPoints,
      fielding: fieldingPoints,
      team: teamPoints,
      special: specialPoints,
      total: battingPoints + bowlingPoints + fieldingPoints + teamPoints + specialPoints
    };
  } catch (error) {
    console.error('Error calculating player MVP points:', error);
    throw error;
  }
};

export const updateLeaderboard = async (): Promise<MVPLeaderboard> => {
  try {
    const supabase = getSupabaseClient();
    
    // Get active season
    const { data: seasons } = await supabase
      .from(TABLES.SEASONS)
      .select('seasonId')
      .eq('isActive', true)
      .limit(1);
      
    const seasonId = seasons?.[0]?.seasonId || 'default';
    
    // Get all players for the leaderboard
    const entries = await getLeaderboard();
    const entryIds = entries.map(entry => entry.entryId);
    
    // Create or update the leaderboard record
    const newLeaderboard: MVPLeaderboard = {
      leaderboardId: `${seasonId}-${new Date().toISOString()}`,
      seasonId,
      lastUpdated: new Date().toISOString(),
      entries: entryIds
    };
    
    // Store the leaderboard
    const { error: leaderboardError } = await supabase
      .from(TABLES.MVP_LEADERBOARDS)
      .insert(newLeaderboard);
      
    if (leaderboardError) throw leaderboardError;
    
    // Store all entries
    const { error: entriesError } = await supabase
      .from(TABLES.MVP_ENTRIES)
      .insert(entries);
      
    if (entriesError) throw entriesError;
    
    return newLeaderboard;
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    throw error;
  }
};

// Season management functions
export const getSeasons = async (): Promise<Season[]> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLES.SEASONS)
    .select('*');
    
  if (error) {
    console.error('Error fetching seasons:', error);
    throw error;
  }
  
  return data || [];
};

export const getActiveSeasonId = async (): Promise<string | null> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLES.SEASONS)
    .select('seasonId')
    .eq('isActive', true)
    .limit(1);
    
  if (error) {
    console.error('Error fetching active season:', error);
    throw error;
  }
  
  return data?.[0]?.seasonId || null;
};

export const setActiveSeason = async (seasonId: string): Promise<void> => {
  const supabase = getSupabaseClient();
  
  try {
    // First, set all seasons to inactive
    await supabase
      .from(TABLES.SEASONS)
      .update({ isActive: false })
      .neq('seasonId', seasonId);
      
    // Then set the selected season to active
    const { error } = await supabase
      .from(TABLES.SEASONS)
      .update({ isActive: true })
      .eq('seasonId', seasonId);
      
    if (error) throw error;
  } catch (error) {
    console.error('Error setting active season:', error);
    throw error;
  }
};

export const createSeason = async (season: Omit<Season, 'seasonId'>): Promise<Season> => {
  const newSeason: Season = {
    ...season,
    seasonId: uuidv4()
  };
  
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from(TABLES.SEASONS)
    .insert(newSeason);
    
  if (error) {
    console.error('Error creating season:', error);
    throw error;
  }
  
  return newSeason;
};