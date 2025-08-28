export type PcMatchDetail = {
  match_details: Array<PcMatch>;
};

export type PcMatch = {
  match_id: string | number;
  match_date?: string;
  status?: string;
  result?: string;
  result_description?: string;
  toss?: string;
  home_team_id?: string; home_team_name?: string;
  away_team_id?: string; away_team_name?: string;
  points?: Array<{
    team_id: string;
    game_points?: string;
    penalty_points?: string;
    bonus_points_batting?: string;
    bonus_points_bowling?: string;
  }>;
  players?: Array<{
    home_team?: PcTeamSheet[];
    away_team?: PcTeamSheet[];
  }>;
  innings: PcInnings[];
};

export type PcTeamSheet = {
  position: number;
  player_name: string;
  player_id?: number | string;
  captain?: boolean;
  wicket_keeper?: boolean;
};

export type PcInnings = {
  team_batting_name: string;
  team_batting_id: string;
  innings_number: number | string;
  runs?: string; wickets?: string; overs?: string;

  extra_byes?: string; extra_leg_byes?: string; extra_wides?: string;
  extra_no_balls?: string; extra_penalty_runs?: string;

  bat: Array<{
    position?: string | number;
    batsman_name: string;
    batsman_id?: string | number;
    how_out: string; // e.g. "ct", "b", "lbw", "no" (not out)
    fielder_name?: string; fielder_id?: string | number;
    bowler_name?: string; bowler_id?: string | number;
    runs?: string; balls?: string; fours?: string; sixes?: string;
  }>;

  bowl: Array<{
    bowler_name: string;
    bowler_id?: string | number;
    overs?: string; maidens?: string; runs?: string; wickets?: string;
    wides?: string; no_balls?: string;
  }>;
};
