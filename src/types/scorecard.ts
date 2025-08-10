// Types for the scorecard analysis feature
export interface ScorecardPlayerMVP {
  playerName: string;
  mvpPoints: number;
  specialAchievements: string[];
  contributions: {
    batting: {
      points: number;
      details?: string[];
    };
    bowling: {
      points: number;
      details?: string[];
    };
    fielding: {
      points: number;
      details?: string[];
    };
    team: {
      points: number;
      details?: string[];
    };
  };
}

export interface ScorecardPlayerRole {
  isCaptain?: boolean;
  isWicketkeeper?: boolean;
}

export interface ScorecardPlayerPerformance {
  role: ScorecardPlayerRole;
  batting?: {
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    status: string;
  };
  bowling?: {
    overs: number;
    maidens: number;
    runs: number;
    wickets: number;
    economy: number;
  };
  fielding?: {
    catches: number;
    stumpings: number;
    runOuts: number;
  };
}

export interface ScorecardPlayerData {
  mvp: ScorecardPlayerMVP;
  performance: ScorecardPlayerPerformance;
}

export interface ScorecardMatchData {
  date: string;
  competition: string;
  venue: string;
  opposition: string;
  matchResult: string;
}

export interface ProcessedScorecardData {
  match: ScorecardMatchData;
  players: ScorecardPlayerData[];
}