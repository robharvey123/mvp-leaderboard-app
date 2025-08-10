/**
 * Google Sheets Service Entity Functions
 * 
 * Functions for handling specific entities in the Google Sheets service
 */

import { v4 as uuid } from 'uuid';
import {
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

// Player-related functions
export async function getPlayers(): Promise<Player[]> {
  return getFromSheet<Player>(SHEET_NAMES.PLAYERS);
}

export async function getPlayerById(playerId: string): Promise<Player | undefined> {
  return getItemById<Player>(SHEET_NAMES.PLAYERS, 'playerId', playerId);
}

export async function createPlayer(player: Omit<Player, 'playerId'>): Promise<Player> {
  const newPlayer: Player = {
    ...player,
    playerId: uuid()
  };
  
  return saveItemToSheet(SHEET_NAMES.PLAYERS, 'playerId', newPlayer);
}

export async function updatePlayer(playerId: string, updates: Partial<Player>): Promise<Player> {
  const player = await getPlayerById(playerId);
  
  if (!player) {
    throw new Error('Player not found');
  }
  
  const updatedPlayer = { ...player, ...updates };
  return saveItemToSheet(SHEET_NAMES.PLAYERS, 'playerId', updatedPlayer);
}

export async function deletePlayer(playerId: string): Promise<boolean> {
  return removeItemFromSheet<Player>(SHEET_NAMES.PLAYERS, 'playerId', playerId);
}

// Match-related functions
export async function getMatches(): Promise<Match[]> {
  const matches = getFromSheet<Match>(SHEET_NAMES.MATCHES);
  return matches.sort((a, b) => 
    new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
  );
}

export async function getMatchById(matchId: string): Promise<Match | undefined> {
  return getItemById<Match>(SHEET_NAMES.MATCHES, 'matchId', matchId);
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
  
  return saveItemToSheet(SHEET_NAMES.MATCHES, 'matchId', newMatch);
}

export async function updateMatch(matchId: string, updates: Partial<Match>): Promise<Match> {
  const match = await getMatchById(matchId);
  
  if (!match) {
    throw new Error('Match not found');
  }
  
  const updatedMatch = { ...match, ...updates };
  return saveItemToSheet(SHEET_NAMES.MATCHES, 'matchId', updatedMatch);
}

export async function deleteMatch(matchId: string): Promise<boolean> {
  return removeItemFromSheet<Match>(SHEET_NAMES.MATCHES, 'matchId', matchId);
}

// Performance-related functions
export async function getBattingPerformances(matchId: string): Promise<BattingPerformance[]> {
  const performances = getFromSheet<BattingPerformance>(SHEET_NAMES.BATTING);
  return performances.filter(perf => perf.matchId === matchId);
}

export async function getBowlingPerformances(matchId: string): Promise<BowlingPerformance[]> {
  const performances = getFromSheet<BowlingPerformance>(SHEET_NAMES.BOWLING);
  return performances.filter(perf => perf.matchId === matchId);
}

export async function getFieldingPerformances(matchId: string): Promise<FieldingPerformance[]> {
  const performances = getFromSheet<FieldingPerformance>(SHEET_NAMES.FIELDING);
  return performances.filter(perf => perf.matchId === matchId);
}

export async function savePlayerPerformances(
  matchId: string,
  batting: BattingPerformance[],
  bowling: BowlingPerformance[],
  fielding: FieldingPerformance[]
): Promise<void> {
  // Get existing performances
  const existingBatting = getFromSheet<BattingPerformance>(SHEET_NAMES.BATTING);
  const existingBowling = getFromSheet<BowlingPerformance>(SHEET_NAMES.BOWLING);
  const existingFielding = getFromSheet<FieldingPerformance>(SHEET_NAMES.FIELDING);
  
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
  saveToSheet(SHEET_NAMES.BATTING, updatedBatting);
  saveToSheet(SHEET_NAMES.BOWLING, updatedBowling);
  saveToSheet(SHEET_NAMES.FIELDING, updatedFielding);
  
  // Update the leaderboard
  await updateLeaderboard();
}

// Leaderboard-related functions
export async function getLeaderboard(filters?: LeaderboardFilters): Promise<PlayerMVPEntry[]> {
  let entries = getFromSheet<PlayerMVPEntry>(SHEET_NAMES.MVP_ENTRIES);
  
  // Apply filters if provided
  if (filters) {
    if (filters.seasonId) {
      const leaderboards = getFromSheet<MVPLeaderboard>(SHEET_NAMES.LEADERBOARDS);
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
  const activeSeasonId = localStorage.getItem(SHEET_NAMES.ACTIVE_SEASON);
  if (!activeSeasonId) {
    throw new Error('No active season found');
  }
  
  // Get all performances
  const battingPerfs = getFromSheet<BattingPerformance>(SHEET_NAMES.BATTING);
  const bowlingPerfs = getFromSheet<BowlingPerformance>(SHEET_NAMES.BOWLING);
  const fieldingPerfs = getFromSheet<FieldingPerformance>(SHEET_NAMES.FIELDING);
  const specialDesignations = getFromSheet<SpecialDesignation>(SHEET_NAMES.SPECIAL);
  const players = await getPlayers();
  
  // Get or create leaderboard for active season
  const leaderboards = getFromSheet<MVPLeaderboard>(SHEET_NAMES.LEADERBOARDS);
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
  saveToSheet(SHEET_NAMES.LEADERBOARDS, leaderboards);
  saveToSheet(SHEET_NAMES.MVP_ENTRIES, sortedEntries);
  
  return leaderboard;
}

// Season-related functions
export async function getSeasons(): Promise<Season[]> {
  return getFromSheet<Season>(SHEET_NAMES.SEASONS);
}

export async function getActiveSeasonId(): Promise<string | null> {
  return localStorage.getItem(SHEET_NAMES.ACTIVE_SEASON);
}

export async function setActiveSeason(seasonId: string): Promise<void> {
  const seasons = await getSeasons();
  const season = seasons.find(s => s.seasonId === seasonId);
  
  if (!season) {
    throw new Error('Season not found');
  }
  
  localStorage.setItem(SHEET_NAMES.ACTIVE_SEASON, seasonId);
}

export async function createSeason(season: Omit<Season, 'seasonId'>): Promise<Season> {
  const newSeason: Season = {
    ...season,
    seasonId: uuid()
  };
  
  return saveItemToSheet(SHEET_NAMES.SEASONS, 'seasonId', newSeason);
}