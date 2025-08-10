/**
 * Scorecard Service
 * Handles processing scorecard data and integrating with the MVP system
 */

import { v4 as uuidv4 } from 'uuid';
import * as LocalStorage from './storage-service';
import * as SupabaseService from './supabase-service';
import * as SheetsEntities from './sheets-service-entities';
import { getCurrentBackend } from './data-service';
import { 
  ProcessedScorecardData, 
  ScorecardPlayerData 
} from '@/types/scorecard';
import {
  BattingPerformance,
  BowlingPerformance,
  FieldingPerformance,
  Match,
  Player
} from '@/types';

/**
 * Save scorecard results to the appropriate backend
 */
export const saveScorecardResults = async (data: ProcessedScorecardData): Promise<void> => {
  // Get the current backend
  const currentBackend = getCurrentBackend();
  
  try {
    // 1. Process the match data
    const matchData = await processMatchData(data);
    
    // 2. Process the player performances
    const performances = await processPlayerPerformances(data, matchData.matchId);
    
    // 3. Save the match and performance data to the backend
    await saveMatchAndPerformances(
      currentBackend, 
      matchData, 
      performances.battingPerformances,
      performances.bowlingPerformances,
      performances.fieldingPerformances
    );
    
    // 4. Update the leaderboard with new data
    switch (currentBackend) {
      case 'localStorage':
        await LocalStorage.updateLeaderboard();
        break;
      case 'supabase':
        await SupabaseService.updateLeaderboard();
        break;
      case 'googleSheets':
        await SheetsEntities.updateLeaderboard();
        break;
    }
    
    console.log('Scorecard data processed and saved successfully');
  } catch (error) {
    console.error('Error saving scorecard results:', error);
    throw new Error('Failed to save scorecard results');
  }
};

/**
 * Process match data from scorecard
 */
async function processMatchData(data: ProcessedScorecardData): Promise<Match> {
  const matchDate = new Date(data.match.date);
  const matchId = uuidv4();
  
  // Determine season ID based on match date
  const currentBackend = getCurrentBackend();
  let seasons;
  switch (currentBackend) {
    case 'localStorage':
      seasons = await LocalStorage.getSeasons();
      break;
    case 'supabase':
      seasons = await SupabaseService.getSeasons();
      break;
    case 'googleSheets':
      seasons = await SheetsEntities.getSeasons();
      break;
    default:
      seasons = await LocalStorage.getSeasons();
  }
  
  // Find the season that contains this match date, or use the latest season
  const matchSeason = seasons.find(s => {
    const startDate = new Date(s.startDate);
    const endDate = new Date(s.endDate);
    return matchDate >= startDate && matchDate <= endDate;
  }) || seasons[seasons.length - 1] || { seasonId: 'current' };
  
  // Create match object
  const match: Match = {
    matchId,
    seasonId: matchSeason.seasonId,
    date: matchDate.toISOString(),
    opposition: data.match.opposition,
    venue: data.match.venue || 'Unknown',
    matchType: data.match.competition.includes('League') ? 'League' : 'Friendly',
    result: data.match.matchResult,
    scorecard: `${data.match.opposition} vs Brookweald CC`,
    brookwealdScore: data.match.brookwealdScore || 'Not available',
    oppositionScore: data.match.oppositionScore || 'Not available',
    notes: `Imported from scorecard on ${new Date().toLocaleDateString()}`,
    isComplete: true,
  };
  
  return match;
}

/**
 * Process player performances from scorecard
 */
async function processPlayerPerformances(data: ProcessedScorecardData, matchId: string): Promise<{
  battingPerformances: BattingPerformance[];
  bowlingPerformances: BowlingPerformance[];
  fieldingPerformances: FieldingPerformance[];
}> {
  const battingPerformances: BattingPerformance[] = [];
  const bowlingPerformances: BowlingPerformance[] = [];
  const fieldingPerformances: FieldingPerformance[] = [];
  
  // Get existing players from backend
  const currentBackend = getCurrentBackend();
  let existingPlayers: Player[];
  switch (currentBackend) {
    case 'localStorage':
      existingPlayers = await LocalStorage.getPlayers();
      break;
    case 'supabase':
      existingPlayers = await SupabaseService.getPlayers();
      break;
    case 'googleSheets':
      existingPlayers = await SheetsEntities.getPlayers();
      break;
    default:
      existingPlayers = await LocalStorage.getPlayers();
  }
  
  // Process each player's data
  for (const playerData of data.players) {
    const player = playerData.mvp;
    const performance = playerData.performance;
    
    // Try to find the player in existing players
    let playerRecord = existingPlayers.find(p => 
      p.name.toLowerCase() === player.playerName.toLowerCase()
    );
    
    // If player doesn't exist, create a new one
    if (!playerRecord) {
      const newPlayer = {
        name: player.playerName,
        email: '', // Empty as we don't have email from scorecard
        position: 'Unknown', // Default position
        battingStyle: 'Unknown', // Default batting style
        bowlingStyle: 'Unknown', // Default bowling style
        dateJoined: new Date().toISOString(),
        profileImage: '', // No image available
        isActive: true,
      };
      
      // Create player in backend
      switch (currentBackend) {
        case 'localStorage':
          playerRecord = await LocalStorage.createPlayer(newPlayer);
          break;
        case 'supabase':
          playerRecord = await SupabaseService.createPlayer(newPlayer);
          break;
        case 'googleSheets':
          playerRecord = await SheetsEntities.createPlayer(newPlayer);
          break;
        default:
          playerRecord = await LocalStorage.createPlayer(newPlayer);
      }
    }
    
    // Process batting performance if available
    if (performance.batting) {
      const battingData = performance.batting;
      battingPerformances.push({
        performanceId: uuidv4(),
        matchId,
        playerId: playerRecord.playerId,
        runs: battingData.runs || 0,
        ballsFaced: battingData.balls || 0,
        fours: battingData.fours || 0,
        sixes: battingData.sixes || 0,
        howOut: battingData.status || 'Unknown',
        battingPosition: battingData.position || 0,
        mvpPoints: player.battingPoints || 0,
      });
    }
    
    // Process bowling performance if available
    if (performance.bowling) {
      const bowlingData = performance.bowling;
      bowlingPerformances.push({
        performanceId: uuidv4(),
        matchId,
        playerId: playerRecord.playerId,
        overs: bowlingData.overs || 0,
        maidens: bowlingData.maidens || 0,
        runs: bowlingData.runs || 0,
        wickets: bowlingData.wickets || 0,
        wides: bowlingData.wides || 0,
        noBalls: bowlingData.no_balls || 0,
        economy: bowlingData.economy || 0,
        mvpPoints: player.bowlingPoints || 0,
      });
    }
    
    // Process fielding performance if available
    if (performance.fielding) {
      const fieldingData = performance.fielding;
      fieldingPerformances.push({
        performanceId: uuidv4(),
        matchId,
        playerId: playerRecord.playerId,
        catches: fieldingData.catches || 0,
        runOuts: fieldingData.run_outs || 0,
        stumpings: fieldingData.stumpings || 0,
        mvpPoints: player.fieldingPoints || 0,
      });
    }
  }
  
  return {
    battingPerformances,
    bowlingPerformances,
    fieldingPerformances
  };
}

/**
 * Save match and performance data to the appropriate backend
 */
async function saveMatchAndPerformances(
  backend: string,
  match: Match,
  battingPerformances: BattingPerformance[],
  bowlingPerformances: BowlingPerformance[],
  fieldingPerformances: FieldingPerformance[]
): Promise<void> {
  switch (backend) {
    case 'localStorage':
      // Create match first
      await LocalStorage.createMatch(match);
      // Then save performances
      await LocalStorage.savePlayerPerformances(
        match.matchId,
        battingPerformances,
        bowlingPerformances,
        fieldingPerformances
      );
      break;
    case 'supabase':
      // Create match first
      await SupabaseService.createMatch(match);
      // Then save performances
      await SupabaseService.savePlayerPerformances(
        match.matchId,
        battingPerformances,
        bowlingPerformances,
        fieldingPerformances
      );
      break;
    case 'googleSheets':
      // Create match first
      await SheetsEntities.createMatch(match);
      // Then save performances
      await SheetsEntities.savePlayerPerformances(
        match.matchId,
        battingPerformances,
        bowlingPerformances,
        fieldingPerformances
      );
      break;
    default:
      throw new Error(`Unknown backend: ${backend}`);
  }
}