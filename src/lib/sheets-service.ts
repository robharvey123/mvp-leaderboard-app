/**
 * Google Sheets Service
 * 
 * Provides a simulated Google Sheets API for the Brookweald CC MVP Leaderboard app.
 * This implementation uses localStorage as a backend but structures the data as if
 * it were coming from Google Sheets.
 * 
 * In a production environment, this would be replaced with actual Google Sheets API calls.
 */

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

import {
  SHEET_NAMES,
  getFromSheet,
  saveToSheet,
  getItemById,
  saveItemToSheet,
  removeItemFromSheet
} from './sheets-service-helpers';

// Initialize the Google Sheets service
export async function initStorage(): Promise<void> {
  try {
    // Set Google Sheets as configured
    localStorage.setItem('brookweald_sheets_configured', 'true');
    
    // Initialize sample data if needed
    await initializeSampleData();
    
    console.log('Google Sheets service initialized');
  } catch (error) {
    console.error('Failed to initialize Google Sheets service:', error);
  }
}

// Initialize sample data for demonstration
export async function initializeSampleData(): Promise<void> {
  // Check if data already exists
  const users = getFromSheet<User>(SHEET_NAMES.USERS);
  
  if (users.length > 0) {
    console.log('Sample data already exists in Google Sheets simulation');
    return;
  }
  
  console.log('Initializing sample data in Google Sheets simulation');
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
  
  // Save all data to sheets
  saveToSheet(SHEET_NAMES.USERS, sampleUsers);
  saveToSheet(SHEET_NAMES.PLAYERS, players);
  saveToSheet(SHEET_NAMES.SEASONS, [currentSeason]);
  saveToSheet(SHEET_NAMES.MATCHES, matches);
  saveToSheet(SHEET_NAMES.BATTING, battingPerformances);
  saveToSheet(SHEET_NAMES.BOWLING, bowlingPerformances);
  saveToSheet(SHEET_NAMES.FIELDING, fieldingPerformances);
  saveToSheet(SHEET_NAMES.LEADERBOARDS, [leaderboard]);
  saveToSheet(SHEET_NAMES.MVP_ENTRIES, mvpEntries);
  
  // Save active season to localStorage
  localStorage.setItem(SHEET_NAMES.ACTIVE_SEASON, currentSeason.seasonId);
  
  console.log('Sample data initialized successfully in Google Sheets simulation');
}

// User-related functions
export async function getUsers(): Promise<User[]> {
  return getFromSheet<User>(SHEET_NAMES.USERS);
}

export async function getUserById(userId: string): Promise<User | undefined> {
  return getItemById<User>(SHEET_NAMES.USERS, 'userId', userId);
}

export async function registerUser(email: string, name: string, password: string): Promise<User> {
  const users = await getUsers();
  
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
  
  // Save user to sheet
  return saveItemToSheet(SHEET_NAMES.USERS, 'userId', newUser);
}

export async function loginUser(email: string, password: string): Promise<{ user: User, token: string }> {
  const users = await getUsers();
  
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
  await saveItemToSheet(SHEET_NAMES.USERS, 'userId', user);
  
  // Generate token (simple implementation)
  const token = `token_${user.userId}_${Date.now()}`;
  
  // Save token and current user to localStorage
  localStorage.setItem(SHEET_NAMES.AUTH_TOKEN, token);
  localStorage.setItem(SHEET_NAMES.CURRENT_USER, JSON.stringify(user));
  
  return { user, token };
}

export async function logoutUser(): Promise<void> {
  localStorage.removeItem(SHEET_NAMES.AUTH_TOKEN);
  localStorage.removeItem(SHEET_NAMES.CURRENT_USER);
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const userJson = localStorage.getItem(SHEET_NAMES.CURRENT_USER);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('Error retrieving current user:', error);
    return null;
  }
}

export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
  const user = await getUserById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Don't allow changing role or email through this function
  const { role, email, ...allowedUpdates } = updates;
  
  const updatedUser = { ...user, ...allowedUpdates };
  await saveItemToSheet(SHEET_NAMES.USERS, 'userId', updatedUser);
  
  // If this is the current user, update local storage
  const currentUser = await getCurrentUser();
  if (currentUser && currentUser.userId === userId) {
    localStorage.setItem(SHEET_NAMES.CURRENT_USER, JSON.stringify(updatedUser));
  }
  
  return updatedUser;
}