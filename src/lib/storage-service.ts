import { v4 as uuid } from 'uuid';
import {
  User,
  Player,
  Match,
  Season,
  BattingPerformance,
  BowlingPerformance,
  FieldingPerformance,
  SpecialDesignation,
  MVPLeaderboard,
  PlayerMVPEntry,
  LeaderboardFilters,
  PointsBreakdown
} from '@/types';

// Storage keys for localStorage
export const STORAGE_KEYS = {
  USERS: 'brookweald_users',
  PLAYERS: 'brookweald_players',
  SEASONS: 'brookweald_seasons',
  MATCHES: 'brookweald_matches',
  BATTING_PERFORMANCES: 'brookweald_batting_performances',
  BOWLING_PERFORMANCES: 'brookweald_bowling_performances',
  FIELDING_PERFORMANCES: 'brookweald_fielding_performances',
  SPECIAL_DESIGNATIONS: 'brookweald_special_designations',
  LEADERBOARDS: 'brookweald_leaderboards',
  MVP_ENTRIES: 'brookweald_mvp_entries',
  AUTH_TOKEN: 'brookweald_auth_token',
  CURRENT_USER: 'brookweald_current_user',
  ACTIVE_SEASON: 'brookweald_active_season',
};

// Initialize the local storage
export async function initStorage(): Promise<void> {
  try {
    // Set localStorage as configured
    localStorage.setItem('brookweald_storage_configured', 'true');
    
    // Initialize sample data if needed
    await initializeSampleData();
    
    console.log('Local storage initialized');
  } catch (error) {
    console.error('Failed to initialize local storage:', error);
  }
}

// Generic helper functions for localStorage
export function getFromStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error retrieving data from ${key}:`, error);
    return [];
  }
}

export function saveToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving data to ${key}:`, error);
    throw new Error(`Failed to save data to storage: ${error}`);
  }
}

export function getItemById<T extends Record<string, unknown>>(
  key: string,
  idField: string,
  id: string
): T | undefined {
  const items = getFromStorage<T>(key);
  return items.find(item => item[idField] === id);
}

export function saveItemToStorage<T extends Record<string, unknown>>(
  key: string,
  idField: string,
  item: T
): T {
  const items = getFromStorage<T>(key);
  const existingIndex = items.findIndex(i => i[idField] === item[idField]);
  
  if (existingIndex >= 0) {
    // Update existing item
    items[existingIndex] = { ...items[existingIndex], ...item };
  } else {
    // Add new item
    items.push(item);
  }
  
  saveToStorage(key, items);
  return item;
}

export function removeItemFromStorage<T extends Record<string, unknown>>(
  key: string,
  idField: string,
  id: string
): boolean {
  const items = getFromStorage<T>(key);
  const initialLength = items.length;
  const filteredItems = items.filter(item => item[idField] !== id);
  
  if (filteredItems.length !== initialLength) {
    saveToStorage(key, filteredItems);
    return true;
  }
  
  return false;
}

// Initialize sample data for demonstration
export async function initializeSampleData(): Promise<void> {
  // Check if data already exists
  const existingUsers = getFromStorage<User>(STORAGE_KEYS.USERS);
  
  if (existingUsers.length > 0) {
    console.log('Sample data already exists');
    return;
  }
  
  const currentDate = new Date().toISOString();
  
  // Create admin user
  const adminUser: User = {
    userId: uuid(),
    email: 'admin@brookwealdcc.com',
    name: 'Admin User',
    role: 'admin',
    createdAt: currentDate,
    lastLogin: currentDate,
    passwordHash: 'admin' // In a real app, this would be properly hashed
  };
  
  // Create sample users
  const sampleUsers: User[] = [
    adminUser,
    {
      userId: uuid(),
      email: 'john.smith@example.com',
      name: 'John Smith',
      role: 'player',
      createdAt: currentDate,
      lastLogin: currentDate,
      passwordHash: 'password'
    },
    {
      userId: uuid(),
      email: 'michael.taylor@example.com',
      name: 'Michael Taylor',
      role: 'player',
      createdAt: currentDate,
      lastLogin: currentDate,
      passwordHash: 'password'
    }
  ];
  
  // Create sample season
  const currentSeason: Season = {
    seasonId: uuid(),
    name: '2025 Season',
    startDate: '2025-04-01',
    endDate: '2025-09-30',
    isActive: true
  };
  
  // Create sample players
  const players: Player[] = [
    {
      playerId: uuid(),
      userId: sampleUsers[1].userId,
      firstName: 'John',
      lastName: 'Smith',
      isActive: true,
      primaryRole: 'Batsman'
    },
    {
      playerId: uuid(),
      userId: sampleUsers[2].userId,
      firstName: 'Michael',
      lastName: 'Taylor',
      isActive: true,
      primaryRole: 'All-rounder'
    },
    {
      playerId: uuid(),
      firstName: 'Andrew',
      lastName: 'Brown',
      isActive: true,
      primaryRole: 'Bowler'
    },
    {
      playerId: uuid(),
      firstName: 'David',
      lastName: 'Wilson',
      isActive: true,
      primaryRole: 'Wicket-keeper'
    },
    {
      playerId: uuid(),
      firstName: 'James',
      lastName: 'Roberts',
      isActive: true,
      primaryRole: 'All-rounder'
    }
  ];
  
  // Create sample matches
  const matches: Match[] = [
    {
      matchId: uuid(),
      seasonId: currentSeason.seasonId,
      matchDate: '2025-05-12',
      opponent: 'Chelmsford CC',
      venue: 'Home',
      result: 'Win',
      resultDetails: 'Won by 5 wickets',
      isComplete: true
    },
    {
      matchId: uuid(),
      seasonId: currentSeason.seasonId,
      matchDate: '2025-05-26',
      opponent: 'Brentwood CC',
      venue: 'Away',
      result: 'Loss',
      resultDetails: 'Lost by 20 runs',
      isComplete: true
    },
    {
      matchId: uuid(),
      seasonId: currentSeason.seasonId,
      matchDate: '2025-06-09',
      opponent: 'Epping CC',
      venue: 'Home',
      result: 'Win',
      resultDetails: 'Won by 3 wickets',
      isComplete: true
    }
  ];
  
  // Create sample batting performances
  const battingPerformances: BattingPerformance[] = [
    {
      performanceId: uuid(),
      matchId: matches[0].matchId,
      playerId: players[0].playerId,
      playerName: `${players[0].firstName} ${players[0].lastName}`,
      runsScored: 120,
      ballsFaced: 110,
      fours: 12,
      sixes: 5,
      dismissalType: 'Not Out',
      mvpPoints: 150
    },
    {
      performanceId: uuid(),
      matchId: matches[0].matchId,
      playerId: players[1].playerId,
      playerName: `${players[1].firstName} ${players[1].lastName}`,
      runsScored: 45,
      ballsFaced: 38,
      fours: 6,
      sixes: 1,
      dismissalType: 'Caught',
      bowler: 'J. Williams',
      mvpPoints: 45
    },
    {
      performanceId: uuid(),
      matchId: matches[1].matchId,
      playerId: players[2].playerId,
      playerName: `${players[2].firstName} ${players[2].lastName}`,
      runsScored: 22,
      ballsFaced: 25,
      fours: 2,
      sixes: 0,
      dismissalType: 'Bowled',
      bowler: 'T. Davis',
      mvpPoints: 22
    }
  ];
  
  // Create sample bowling performances
  const bowlingPerformances: BowlingPerformance[] = [
    {
      performanceId: uuid(),
      matchId: matches[0].matchId,
      playerId: players[2].playerId,
      playerName: `${players[2].firstName} ${players[2].lastName}`,
      overs: 10,
      maidens: 2,
      runsConceded: 35,
      wickets: 5,
      mvpPoints: 85
    },
    {
      performanceId: uuid(),
      matchId: matches[1].matchId,
      playerId: players[1].playerId,
      playerName: `${players[1].firstName} ${players[1].lastName}`,
      overs: 8,
      maidens: 1,
      runsConceded: 45,
      wickets: 2,
      mvpPoints: 32
    },
    {
      performanceId: uuid(),
      matchId: matches[2].matchId,
      playerId: players[2].playerId,
      playerName: `${players[2].firstName} ${players[2].lastName}`,
      overs: 10,
      maidens: 3,
      runsConceded: 28,
      wickets: 4,
      mvpPoints: 70
    }
  ];
  
  // Create sample fielding performances
  const fieldingPerformances: FieldingPerformance[] = [
    {
      performanceId: uuid(),
      matchId: matches[0].matchId,
      playerId: players[3].playerId,
      playerName: `${players[3].firstName} ${players[3].lastName}`,
      catches: 2,
      stumpings: 1,
      directRunOuts: 0,
      assistedRunOuts: 1,
      droppedCatches: 0,
      mvpPoints: 25
    },
    {
      performanceId: uuid(),
      matchId: matches[1].matchId,
      playerId: players[1].playerId,
      playerName: `${players[1].firstName} ${players[1].lastName}`,
      catches: 3,
      stumpings: 0,
      directRunOuts: 1,
      assistedRunOuts: 0,
      droppedCatches: 1,
      mvpPoints: 25
    }
  ];
  
  // Create leaderboard
  const leaderboard: MVPLeaderboard = {
    leaderboardId: uuid(),
    seasonId: currentSeason.seasonId,
    lastUpdated: currentDate,
    entries: []
  };
  
  // Create MVP entries for the leaderboard
  const mvpEntries: PlayerMVPEntry[] = players.map(player => {
    // Calculate player points by summing up performances
    const battingTotal = battingPerformances
      .filter(perf => perf.playerId === player.playerId)
      .reduce((sum, perf) => sum + perf.mvpPoints, 0);
    
    const bowlingTotal = bowlingPerformances
      .filter(perf => perf.playerId === player.playerId)
      .reduce((sum, perf) => sum + perf.mvpPoints, 0);
    
    const fieldingTotal = fieldingPerformances
      .filter(perf => perf.playerId === player.playerId)
      .reduce((sum, perf) => sum + perf.mvpPoints, 0);
    
    const totalPoints = battingTotal + bowlingTotal + fieldingTotal;
    
    return {
      entryId: uuid(),
      leaderboardId: leaderboard.leaderboardId,
      playerId: player.playerId,
      playerName: `${player.firstName} ${player.lastName}`,
      totalMVPPoints: totalPoints,
      battingPoints: battingTotal,
      bowlingPoints: bowlingTotal,
      fieldingPoints: fieldingTotal,
      teamPoints: 0,
      specialPoints: 0
    };
  }).sort((a, b) => b.totalMVPPoints - a.totalMVPPoints);
  
  // Update leaderboard with sorted entries
  leaderboard.entries = mvpEntries.map(entry => entry.entryId);
  
  // Save all data to localStorage
  saveToStorage(STORAGE_KEYS.USERS, sampleUsers);
  saveToStorage(STORAGE_KEYS.PLAYERS, players);
  saveToStorage(STORAGE_KEYS.SEASONS, [currentSeason]);
  saveToStorage(STORAGE_KEYS.MATCHES, matches);
  saveToStorage(STORAGE_KEYS.BATTING_PERFORMANCES, battingPerformances);
  saveToStorage(STORAGE_KEYS.BOWLING_PERFORMANCES, bowlingPerformances);
  saveToStorage(STORAGE_KEYS.FIELDING_PERFORMANCES, fieldingPerformances);
  saveToStorage(STORAGE_KEYS.LEADERBOARDS, [leaderboard]);
  saveToStorage(STORAGE_KEYS.MVP_ENTRIES, mvpEntries);
  
  // Set active season
  localStorage.setItem(STORAGE_KEYS.ACTIVE_SEASON, currentSeason.seasonId);
  
  console.log('Sample data initialized successfully');
}

// User-related functions
export async function getUsers(): Promise<User[]> {
  return getFromStorage<User>(STORAGE_KEYS.USERS);
}

export async function getUserById(userId: string): Promise<User | undefined> {
  return getItemById<User>(STORAGE_KEYS.USERS, 'userId', userId);
}

export async function registerUser(email: string, name: string, password: string): Promise<User> {
  const users = getFromStorage<User>(STORAGE_KEYS.USERS);
  
  // Check if user already exists
  const existingUser = users.find(user => user.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    throw new Error('Email already in use');
  }
  
  // Create new user
  const newUser: User = {
    userId: uuid(),
    email,
    name,
    role: 'public', // Default role for new registrations
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    passwordHash: password // In a real app, this would be properly hashed
  };
  
  // Save user to storage
  saveItemToStorage(STORAGE_KEYS.USERS, 'userId', newUser);
  return newUser;
}

export async function loginUser(email: string, password: string): Promise<{ user: User, token: string }> {
  const users = getFromStorage<User>(STORAGE_KEYS.USERS);
  
  // Find user by email
  const user = users.find(user => user.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  // Check password
  if (user.passwordHash !== password) {
    throw new Error('Invalid email or password');
  }
  
  // Update last login
  user.lastLogin = new Date().toISOString();
  saveItemToStorage(STORAGE_KEYS.USERS, 'userId', user);
  
  // Generate token (simple implementation)
  const token = `token_${user.userId}_${Date.now()}`;
  
  // Save token and current user to localStorage
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  
  return { user, token };
}

export async function logoutUser(): Promise<void> {
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const userJson = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('Error retrieving current user:', error);
    return null;
  }
}

export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
  const user = getItemById<User>(STORAGE_KEYS.USERS, 'userId', userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Don't allow changing role or email through this function
  const { role, email, ...allowedUpdates } = updates;
  
  const updatedUser = { ...user, ...allowedUpdates };
  saveItemToStorage(STORAGE_KEYS.USERS, 'userId', updatedUser);
  
  // If this is the current user, update local storage
  const currentUser = await getCurrentUser();
  if (currentUser && currentUser.userId === userId) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
  }
  
  return updatedUser;
}

// Player-related functions
export async function getPlayers(): Promise<Player[]> {
  return getFromStorage<Player>(STORAGE_KEYS.PLAYERS);
}

export async function getPlayerById(playerId: string): Promise<Player | undefined> {
  return getItemById<Player>(STORAGE_KEYS.PLAYERS, 'playerId', playerId);
}

export async function createPlayer(player: Omit<Player, 'playerId'>): Promise<Player> {
  const newPlayer: Player = {
    ...player,
    playerId: uuid()
  };
  
  return saveItemToStorage(STORAGE_KEYS.PLAYERS, 'playerId', newPlayer);
}

export async function updatePlayer(playerId: string, updates: Partial<Player>): Promise<Player> {
  const player = await getPlayerById(playerId);
  
  if (!player) {
    throw new Error('Player not found');
  }
  
  const updatedPlayer = { ...player, ...updates };
  return saveItemToStorage(STORAGE_KEYS.PLAYERS, 'playerId', updatedPlayer);
}

export async function deletePlayer(playerId: string): Promise<boolean> {
  return removeItemFromStorage<Player>(STORAGE_KEYS.PLAYERS, 'playerId', playerId);
}

// Match-related functions
export async function getMatches(): Promise<Match[]> {
  return getFromStorage<Match>(STORAGE_KEYS.MATCHES).sort((a, b) => 
    new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
  );
}

export async function getMatchById(matchId: string): Promise<Match | undefined> {
  return getItemById<Match>(STORAGE_KEYS.MATCHES, 'matchId', matchId);
}

export async function getRecentMatches(limit: number = 3): Promise<Match[]> {
  const matches = await getMatches();
  return matches.slice(0, limit);
}

export async function createMatch(match: Omit<Match, 'matchId'>): Promise<Match> {
  const newMatch: Match = {
    ...match,
    matchId: uuid()
  };
  
  return saveItemToStorage(STORAGE_KEYS.MATCHES, 'matchId', newMatch);
}

export async function updateMatch(matchId: string, updates: Partial<Match>): Promise<Match> {
  const match = await getMatchById(matchId);
  
  if (!match) {
    throw new Error('Match not found');
  }
  
  const updatedMatch = { ...match, ...updates };
  return saveItemToStorage(STORAGE_KEYS.MATCHES, 'matchId', updatedMatch);
}

export async function deleteMatch(matchId: string): Promise<boolean> {
  return removeItemFromStorage<Match>(STORAGE_KEYS.MATCHES, 'matchId', matchId);
}

// Performance-related functions
export async function getBattingPerformances(matchId: string): Promise<BattingPerformance[]> {
  const performances = getFromStorage<BattingPerformance>(STORAGE_KEYS.BATTING_PERFORMANCES);
  return performances.filter(perf => perf.matchId === matchId);
}

export async function getBowlingPerformances(matchId: string): Promise<BowlingPerformance[]> {
  const performances = getFromStorage<BowlingPerformance>(STORAGE_KEYS.BOWLING_PERFORMANCES);
  return performances.filter(perf => perf.matchId === matchId);
}

export async function getFieldingPerformances(matchId: string): Promise<FieldingPerformance[]> {
  const performances = getFromStorage<FieldingPerformance>(STORAGE_KEYS.FIELDING_PERFORMANCES);
  return performances.filter(perf => perf.matchId === matchId);
}

export async function savePlayerPerformances(
  matchId: string,
  batting: BattingPerformance[],
  bowling: BowlingPerformance[],
  fielding: FieldingPerformance[]
): Promise<void> {
  // Get existing performances
  const existingBatting = getFromStorage<BattingPerformance>(STORAGE_KEYS.BATTING_PERFORMANCES);
  const existingBowling = getFromStorage<BowlingPerformance>(STORAGE_KEYS.BOWLING_PERFORMANCES);
  const existingFielding = getFromStorage<FieldingPerformance>(STORAGE_KEYS.FIELDING_PERFORMANCES);
  
  // Filter out performances for this match
  const filteredBatting = existingBatting.filter(perf => perf.matchId !== matchId);
  const filteredBowling = existingBowling.filter(perf => perf.matchId !== matchId);
  const filteredFielding = existingFielding.filter(perf => perf.matchId !== matchId);
  
  // Add new performances
  const updatedBatting = [...filteredBatting, ...batting.map(perf => ({
    ...perf,
    performanceId: perf.performanceId || uuid(),
    matchId
  }))];
  
  const updatedBowling = [...filteredBowling, ...bowling.map(perf => ({
    ...perf,
    performanceId: perf.performanceId || uuid(),
    matchId
  }))];
  
  const updatedFielding = [...filteredFielding, ...fielding.map(perf => ({
    ...perf,
    performanceId: perf.performanceId || uuid(),
    matchId
  }))];
  
  // Save all updated performances
  saveToStorage(STORAGE_KEYS.BATTING_PERFORMANCES, updatedBatting);
  saveToStorage(STORAGE_KEYS.BOWLING_PERFORMANCES, updatedBowling);
  saveToStorage(STORAGE_KEYS.FIELDING_PERFORMANCES, updatedFielding);
  
  // Update the leaderboard
  await updateLeaderboard();
}

// Leaderboard-related functions
export async function getLeaderboard(filters?: LeaderboardFilters): Promise<PlayerMVPEntry[]> {
  let entries = getFromStorage<PlayerMVPEntry>(STORAGE_KEYS.MVP_ENTRIES);
  
  // Apply filters if provided
  if (filters) {
    if (filters.seasonId) {
      const leaderboards = getFromStorage<MVPLeaderboard>(STORAGE_KEYS.LEADERBOARDS);
      const leaderboard = leaderboards.find(lb => lb.seasonId === filters.seasonId);
      if (leaderboard) {
        entries = entries.filter(entry => entry.leaderboardId === leaderboard.leaderboardId);
      }
    }
    
    if (filters.playerId) {
      entries = entries.filter(entry => entry.playerId === filters.playerId);
    }
    
    // Apply sorting
    const sortField = filters.sortBy || 'totalMVPPoints';
    const sortOrder = filters.sortOrder || 'desc';
    
    entries.sort((a, b) => {
      const aValue = a[sortField as keyof PlayerMVPEntry];
      const bValue = b[sortField as keyof PlayerMVPEntry];
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    // Apply limit
    if (filters.limit && filters.limit > 0) {
      entries = entries.slice(0, filters.limit);
    }
  } else {
    // Default sort by total MVP points descending
    entries.sort((a, b) => b.totalMVPPoints - a.totalMVPPoints);
  }
  
  return entries;
}

export async function getTopPlayers(limit: number = 5): Promise<PlayerMVPEntry[]> {
  return getLeaderboard({ limit, sortBy: 'totalMVPPoints', sortOrder: 'desc' });
}

export async function getPlayerMVPPoints(playerId: string): Promise<PointsBreakdown> {
  const entries = await getLeaderboard({ playerId });
  
  if (entries.length === 0) {
    return {
      batting: 0,
      bowling: 0,
      fielding: 0,
      team: 0,
      special: 0,
      total: 0
    };
  }
  
  const entry = entries[0];
  
  return {
    batting: entry.battingPoints,
    bowling: entry.bowlingPoints,
    fielding: entry.fieldingPoints,
    team: entry.teamPoints,
    special: entry.specialPoints,
    total: entry.totalMVPPoints
  };
}

export async function updateLeaderboard(): Promise<MVPLeaderboard> {
  // Get active season
  const activeSeasonId = localStorage.getItem(STORAGE_KEYS.ACTIVE_SEASON);
  if (!activeSeasonId) {
    throw new Error('No active season found');
  }
  
  // Get all performances
  const battingPerfs = getFromStorage<BattingPerformance>(STORAGE_KEYS.BATTING_PERFORMANCES);
  const bowlingPerfs = getFromStorage<BowlingPerformance>(STORAGE_KEYS.BOWLING_PERFORMANCES);
  const fieldingPerfs = getFromStorage<FieldingPerformance>(STORAGE_KEYS.FIELDING_PERFORMANCES);
  const specialDesignations = getFromStorage<SpecialDesignation>(STORAGE_KEYS.SPECIAL_DESIGNATIONS);
  const players = await getPlayers();
  
  // Get or create leaderboard for active season
  const leaderboards = getFromStorage<MVPLeaderboard>(STORAGE_KEYS.LEADERBOARDS);
  let leaderboard = leaderboards.find(lb => lb.seasonId === activeSeasonId);
  
  if (!leaderboard) {
    leaderboard = {
      leaderboardId: uuid(),
      seasonId: activeSeasonId,
      lastUpdated: new Date().toISOString(),
      entries: []
    };
    leaderboards.push(leaderboard);
  }
  
  // Calculate MVP points for each player
  const playerEntries: PlayerMVPEntry[] = players.map(player => {
    // Sum up batting points
    const battingPoints = battingPerfs
      .filter(perf => perf.playerId === player.playerId)
      .reduce((sum, perf) => sum + perf.mvpPoints, 0);
    
    // Sum up bowling points
    const bowlingPoints = bowlingPerfs
      .filter(perf => perf.playerId === player.playerId)
      .reduce((sum, perf) => sum + perf.mvpPoints, 0);
    
    // Sum up fielding points
    const fieldingPoints = fieldingPerfs
      .filter(perf => perf.playerId === player.playerId)
      .reduce((sum, perf) => sum + perf.mvpPoints, 0);
    
    // Sum up special points
    const specialPoints = specialDesignations
      .filter(des => des.playerId === player.playerId)
      .reduce((sum, des) => sum + des.pointsImpact, 0);
    
    // Calculate total points
    const totalPoints = battingPoints + bowlingPoints + fieldingPoints + specialPoints;
    
    return {
      entryId: uuid(),
      leaderboardId: leaderboard!.leaderboardId,
      playerId: player.playerId,
      playerName: `${player.firstName} ${player.lastName}`,
      totalMVPPoints: totalPoints,
      battingPoints,
      bowlingPoints,
      fieldingPoints,
      teamPoints: 0, // To be implemented later
      specialPoints
    };
  });
  
  // Sort entries by total points
  const sortedEntries = playerEntries.sort((a, b) => b.totalMVPPoints - a.totalMVPPoints);
  
  // Update leaderboard
  leaderboard.entries = sortedEntries.map(entry => entry.entryId);
  leaderboard.lastUpdated = new Date().toISOString();
  
  // Save updated leaderboard and entries
  saveToStorage(STORAGE_KEYS.LEADERBOARDS, leaderboards);
  saveToStorage(STORAGE_KEYS.MVP_ENTRIES, sortedEntries);
  
  return leaderboard;
}

// Season-related functions
export async function getSeasons(): Promise<Season[]> {
  return getFromStorage<Season>(STORAGE_KEYS.SEASONS);
}

export async function getActiveSeasonId(): Promise<string | null> {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_SEASON);
}

export async function setActiveSeason(seasonId: string): Promise<void> {
  const seasons = await getSeasons();
  const season = seasons.find(s => s.seasonId === seasonId);
  
  if (!season) {
    throw new Error('Season not found');
  }
  
  localStorage.setItem(STORAGE_KEYS.ACTIVE_SEASON, seasonId);
}

export async function createSeason(season: Omit<Season, 'seasonId'>): Promise<Season> {
  const newSeason: Season = {
    ...season,
    seasonId: uuid()
  };
  
  return saveItemToStorage(STORAGE_KEYS.SEASONS, 'seasonId', newSeason);
}