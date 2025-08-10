// User types
export interface User {
  userId: string;
  email: string;
  name: string;
  role: 'admin' | 'player' | 'public';
  profileImageUrl?: string;
  createdAt: string;
  lastLogin: string;
  passwordHash?: string;
}

export type AuthResult = {
  user: User;
  token: string;
};

// Player types
export interface Player {
  playerId: string;
  userId?: string; // Optional as some players might not have user accounts
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  profileImageUrl?: string;
  isActive: boolean;
  primaryRole?: string;
}

// Season types
export interface Season {
  seasonId: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

// Match types
export interface Match {
  matchId: string;
  seasonId: string;
  matchDate: string;
  opponent: string;
  venue: string;
  result: 'Win' | 'Loss' | 'Draw' | 'No Result';
  resultDetails?: string;
  isComplete: boolean;
}

// Adding the MatchResult enum which was missing
export enum MatchResult {
  WIN = 'Win',
  LOSS = 'Loss',
  DRAW = 'Draw',
  NO_RESULT = 'No Result'
}

export interface MatchScorecard {
  match: Match;
  battingPerformances: BattingPerformance[];
  bowlingPerformances: BowlingPerformance[];
  fieldingPerformances: FieldingPerformance[];
  specialDesignations: SpecialDesignation[];
}

// Performance types
export interface BattingPerformance {
  performanceId: string;
  matchId: string;
  playerId: string;
  playerName?: string; // For display purposes
  runsScored: number;
  ballsFaced?: number;
  fours: number;
  sixes: number;
  dismissalType: string;
  bowler?: string;
  mvpPoints: number;
}

export interface BowlingPerformance {
  performanceId: string;
  matchId: string;
  playerId: string;
  playerName?: string; // For display purposes
  overs: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  mvpPoints: number;
}

export interface FieldingPerformance {
  performanceId: string;
  matchId: string;
  playerId: string;
  playerName?: string; // For display purposes
  catches: number;
  stumpings: number;
  directRunOuts: number;
  assistedRunOuts: number;
  droppedCatches: number;
  mvpPoints: number;
}

export interface SpecialDesignation {
  designationId: string;
  matchId: string;
  playerId: string;
  playerName?: string; // For display purposes
  designationType: string; // e.g., 'Wally of the Week'
  pointsImpact: number;
}

// Adding the SpecialDesignationType enum which is used in the calculator
export enum SpecialDesignationType {
  WALLY_OF_THE_WEEK = 'Wally of the Week',
  PLAYER_OF_THE_MATCH = 'Player of the Match'
}

// Adding the PlayerMatchPerformance interface which is used in the calculator
export interface PlayerMatchPerformance {
  playerId: string;
  playerName: string;
  matchId: string;
  battingPoints: number;
  bowlingPoints: number;
  fieldingPoints: number;
  teamPoints: number;
  specialPoints: number;
  totalMVPPoints: number;
}

// MVP Leaderboard types
export interface MVPLeaderboard {
  leaderboardId: string;
  seasonId: string;
  lastUpdated: string;
  entries: string[];
}

export interface PlayerMVPEntry {
  entryId: string;
  leaderboardId: string;
  playerId: string;
  playerName?: string; // For display purposes
  totalMVPPoints: number;
  battingPoints: number;
  bowlingPoints: number;
  fieldingPoints: number;
  teamPoints: number;
  specialPoints: number;
}

export interface PointsBreakdown {
  batting: number;
  bowling: number;
  fielding: number;
  team: number;
  special: number;
  total: number;
}

// Statistics types
export interface PlayerStats {
  playerId: string;
  matches: number;
  battingStats: {
    innings: number;
    runs: number;
    average: number;
    highScore: number;
    fifties: number;
    hundreds: number;
    fours: number;
    sixes: number;
  };
  bowlingStats: {
    innings: number;
    wickets: number;
    average: number;
    economy: number;
    bestFigures: string;
    fiveWicketHauls: number;
  };
  fieldingStats: {
    catches: number;
    stumpings: number;
    runOuts: number;
  };
  mvpPoints: number;
}

export interface PlayerSeasonStats extends PlayerStats {
  seasonId: string;
  seasonName: string;
}

export interface PlayerCareerStats extends PlayerStats {
  seasons: number;
}

// Filtering and search types
export interface LeaderboardFilters {
  seasonId?: string;
  matchId?: string;
  startDate?: string;
  endDate?: string;
  playerId?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface AuditLog {
  logId: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
}

// Data import/export types
export interface ImportResult {
  matches: Match[];
  errors: unknown[];
}