import {
  BattingPerformance,
  BowlingPerformance,
  FieldingPerformance,
  SpecialDesignation,
  SpecialDesignationType,
  Match,
  MatchResult,
  PlayerMatchPerformance
} from '@/types';

/**
 * Calculates MVP points for a specific type of performance
 */
export const calculateMVPPoints = (
  type: 'batting' | 'bowling' | 'fielding',
  performance: BattingPerformance | BowlingPerformance | FieldingPerformance
): number => {
  if (type === 'batting') {
    return calculateBattingPoints(performance as BattingPerformance);
  } else if (type === 'bowling') {
    return calculateBowlingPoints(performance as BowlingPerformance);
  } else if (type === 'fielding') {
    return calculateFieldingPoints(performance as FieldingPerformance);
  }
  return 0;
};

/**
 * Calculates batting MVP points based on the scoring system
 */
export const calculateBattingPoints = (batting: BattingPerformance): number => {
  let points = 0;
  
  // Base runs
  points += batting.runsScored;
  
  // Boundaries (already included in runs, but get bonus points)
  points += batting.fours * 4;
  points += batting.sixes * 6;
  
  // Milestones
  if (batting.runsScored >= 100) {
    points += 50; // Century bonus
  } else if (batting.runsScored >= 50) {
    points += 25; // Half-century bonus
  }
  
  // Duck penalty (zero runs and out)
  if (batting.runsScored === 0 && batting.dismissalType !== 'Not Out') {
    points -= 15;
  }
  
  return points;
};

/**
 * Calculates bowling MVP points based on the scoring system
 */
export const calculateBowlingPoints = (bowling: BowlingPerformance): number => {
  let points = 0;
  
  // Wickets
  const wicketPoints = bowling.wickets * 25;
  
  // Haul bonuses
  let haulBonus = 0;
  if (bowling.wickets >= 5) {
    // 5-wicket haul is 75 total (not additional)
    haulBonus = 75 - (5 * 25); // Subtract the basic wicket points already counted
  } else if (bowling.wickets === 3 || bowling.wickets === 4) {
    haulBonus = 5; // 3 or 4-wicket bonus
  }
  
  // Maidens
  const maidenPoints = bowling.maidens * 10;
  
  points = wicketPoints + haulBonus + maidenPoints;
  return points;
};

/**
 * Calculates fielding MVP points based on the scoring system
 */
export const calculateFieldingPoints = (fielding: FieldingPerformance): number => {
  let points = 0;
  
  // Catches
  points += fielding.catches * 10;
  
  // Stumpings
  points += fielding.stumpings * 10;
  
  // Run outs
  points += fielding.directRunOuts * 20;
  points += fielding.assistedRunOuts * 10;
  
  // Dropped catches penalty
  points -= fielding.droppedCatches * 10;
  
  return points;
};

/**
 * Calculates team result MVP points
 */
export const calculateTeamPoints = (match: Match, playerId: string): number => {
  // In a real implementation, we'd check if player was in the match's team
  // For simplicity, we're assuming the player was in the match
  if (match.result === MatchResult.WIN) {
    return 3; // 3 points for being in winning team
  }
  return 0;
};

/**
 * Calculates special designation MVP points
 */
export const calculateSpecialDesignationPoints = (designations: SpecialDesignation[]): number => {
  let points = 0;
  
  designations.forEach(designation => {
    if (designation.designationType === SpecialDesignationType.WALLY_OF_THE_WEEK) {
      points -= 3;
    }
    // Other special designations can be added here
  });
  
  return points;
};

/**
 * Calculates total MVP points for a player in a match
 */
export const calculateTotalMVPPoints = (
  batting?: BattingPerformance,
  bowling?: BowlingPerformance,
  fielding?: FieldingPerformance,
  match?: Match,
  designations: SpecialDesignation[] = []
): PlayerMatchPerformance | null => {
  // Validate required parameters
  if (!match) return null;
  
  const playerId = batting?.playerId || bowling?.playerId || fielding?.playerId;
  if (!playerId) return null;
  
  // Calculate individual component points
  const battingPoints = batting ? calculateBattingPoints(batting) : 0;
  const bowlingPoints = bowling ? calculateBowlingPoints(bowling) : 0;
  const fieldingPoints = fielding ? calculateFieldingPoints(fielding) : 0;
  const teamPoints = calculateTeamPoints(match, playerId);
  const specialPoints = calculateSpecialDesignationPoints(designations);
  
  // Sum all points
  const totalMVPPoints = battingPoints + bowlingPoints + fieldingPoints + teamPoints + specialPoints;
  
  return {
    playerId,
    playerName: '', // Name should be fetched from player data
    matchId: match.matchId,
    battingPoints,
    bowlingPoints,
    fieldingPoints,
    teamPoints,
    specialPoints,
    totalMVPPoints
  };
};

/**
 * Recalculate MVP points for all players in a match
 */
export const recalculateMatchMVPPoints = (
  match: Match,
  battingPerformances: BattingPerformance[],
  bowlingPerformances: BowlingPerformance[],
  fieldingPerformances: FieldingPerformance[],
  specialDesignations: SpecialDesignation[],
  playerNames: Record<string, string>
): PlayerMatchPerformance[] => {
  const playerIds = new Set<string>();
  
  // Collect all player IDs from performances
  battingPerformances.forEach(bp => playerIds.add(bp.playerId));
  bowlingPerformances.forEach(bp => playerIds.add(bp.playerId));
  fieldingPerformances.forEach(fp => playerIds.add(fp.playerId));
  specialDesignations.forEach(sd => playerIds.add(sd.playerId));
  
  const results: PlayerMatchPerformance[] = [];
  
  // Calculate MVP points for each player
  playerIds.forEach(playerId => {
    const batting = battingPerformances.find(bp => bp.playerId === playerId);
    const bowling = bowlingPerformances.find(bp => bp.playerId === playerId);
    const fielding = fieldingPerformances.find(fp => fp.playerId === playerId);
    const playerDesignations = specialDesignations.filter(sd => sd.playerId === playerId);
    
    const mvpResult = calculateTotalMVPPoints(batting, bowling, fielding, match, playerDesignations);
    
    if (mvpResult) {
      results.push({
        ...mvpResult,
        playerName: playerNames[playerId] || 'Unknown Player'
      });
    }
  });
  
  return results;
};