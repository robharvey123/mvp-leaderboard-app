export type Insertable<T> = Omit<T, "id" | "created_at">;

export type Club = { id: string; name: string; created_at: string };
export type Player = { id: string; club_id: string; name: string; created_at: string };
export type Match = {
  id: string; club_id: string; match_date: string; opponent?: string | null; venue?: string | null; competition?: string | null; created_at: string;
};
export type Batting = {
  id: string; match_id: string; player_id: string; runs: number; fours: number; sixes: number; fifty: boolean; hundred: boolean; mvp_points: number; created_at: string;
};
export type Bowling = {
  id: string; match_id: string; player_id: string; overs: number; maidens: number; runs: number; wickets: number; five_wkts: boolean; three_wkts: boolean; mvp_points: number; created_at: string;
};
export type Fielding = {
  id: string; match_id: string; player_id: string; catches: number; stumpings: number; runouts: number; mvp_points: number; created_at: string;
};
