// src/lib/data-service.ts
import { supabase } from "@/lib/supabaseClient";

export type LeaderboardRow = {
  player_id: string;
  full_name: string;
  total_points: number;
};

/**
 * Returns top players by summed points.
 * Optional: pass seasonId if your points_events has a season_id column.
 */
export async function getLeaderboard(params: {
  clubId: string;
  seasonId?: string;
  limit?: number;
}): Promise<LeaderboardRow[]> {
  const { clubId, seasonId, limit = 50 } = params;

  // 1) Get club players
  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("id, full_name")
    .eq("club_id", clubId);

  if (playersError) throw playersError;
  if (!players || players.length === 0) return [];

  const playerIds = players.map((p) => p.id);

  // 2) Get points for those players (optionally scoped to season)
  let qe = supabase
    .from("points_events")
    .select("player_id, points")
    .in("player_id", playerIds);

  // If your schema includes season_id on points_events, this will work.
  // If not, remove this filter for now or adjust to join via matches.
  if (seasonId) qe = qe.eq("season_id", seasonId as any);

  const { data: events, error: eventsError } = await qe;
  if (eventsError) throw eventsError;

  // 3) Sum per player
  const totals = new Map<string, number>();
  for (const p of players) totals.set(p.id, 0);
  for (const ev of events || []) {
    const curr = totals.get(ev.player_id) || 0;
    totals.set(ev.player_id, curr + Number(ev.points || 0));
  }

  // 4) Produce rows
  const rows: LeaderboardRow[] = players
    .map((p) => ({
      player_id: p.id,
      full_name: p.full_name,
      total_points: totals.get(p.id) || 0,
    }))
    .sort((a, b) => b.total_points - a.total_points)
    .slice(0, limit);

  return rows;
}
// ---- Types
export type Season = { id: string; name: string; start_date: string; end_date: string };
export type Team = { id: string; name: string };

// ---- Lookups
export async function getSeason(seasonId: string): Promise<Season | null> {
  const { data, error } = await supabase
    .from("seasons")
    .select("id, name, start_date, end_date")
    .eq("id", seasonId)
    .maybeSingle();
  if (error) throw error;
  return (data as Season) ?? null;
}

export async function getTeams(clubId: string): Promise<Team[]> {
  const { data, error } = await supabase
    .from("teams")
    .select("id, name")
    .eq("club_id", clubId)
    .order("name");
  if (error) throw error;
  return (data as Team[]) ?? [];
}

// ---- Season leaderboard (date-bounded via matches)
export async function getSeasonLeaderboard(params: {
  clubId: string;
  seasonId: string;
  limit?: number;
}): Promise<LeaderboardRow[]> {
  const { clubId, seasonId, limit = 50 } = params;
  const season = await getSeason(seasonId);
  if (!season) return [];

  // 1) Players in club
  const { data: players, error: pErr } = await supabase
    .from("players")
    .select("id, full_name")
    .eq("club_id", clubId);
  if (pErr) throw pErr;
  const map = new Map<string, LeaderboardRow>();
  (players ?? []).forEach(p =>
    map.set(p.id, { player_id: p.id, full_name: p.full_name, total_points: 0 })
  );

  // 2) Points joined to matches within season date bounds
  const { data: events, error: eErr } = await supabase
    .from("points_events")
    .select("player_id, points, matches!inner(match_date)")
    .gte("matches.match_date", season.start_date)
    .lte("matches.match_date", season.end_date);
  if (eErr) throw eErr;

  for (const ev of events ?? []) {
    const row = map.get(ev.player_id);
    if (row) row.total_points += Number(ev.points || 0);
  }

  return Array.from(map.values())
    .sort((a, b) => b.total_points - a.total_points)
    .slice(0, limit);
}

// ---- Team leaderboard (all time or use seasonId optional)
export async function getTeamLeaderboard(params: {
  teamId: string;
  seasonId?: string;
  limit?: number;
}): Promise<LeaderboardRow[]> {
  const { teamId, seasonId, limit = 50 } = params;

  // Get players for this team (via squads if you want season-bound membership)
  const { data: playerRows, error: pErr } = seasonId
    ? await supabase
        .from("squads")
        .select("players:player_id(id, full_name)")
        .eq("team_id", teamId)
        .eq("season_id", seasonId)
    : await supabase
        .from("players")
        .select("id, full_name")
        // if you want only players who have ever played for the team,
        // replace this with a join via squads or matches->batting/bowling.
        // For now we’ll include all club players and filter by points below.
        ;

  if (pErr) throw pErr;
  const players =
    (playerRows ?? []).map((r: any) => r.players ?? r) as { id: string; full_name: string }[];

  const map = new Map<string, LeaderboardRow>();
  players.forEach(p =>
    map.set(p.id, { player_id: p.id, full_name: p.full_name, total_points: 0 })
  );

  // Points for matches by this team (+ optional season by date bounds)
  let q = supabase
    .from("points_events")
    .select("player_id, points, matches!inner(match_date, team_id)")
    .eq("matches.team_id", teamId);

  if (seasonId) {
    const season = await getSeason(seasonId);
    if (season) {
      q = q
        .gte("matches.match_date", season.start_date)
        .lte("matches.match_date", season.end_date);
    }
  }

  const { data: events, error: eErr } = await q;
  if (eErr) throw eErr;

  for (const ev of events ?? []) {
    if (!map.has(ev.player_id)) continue; // ignore players not in this team list
    const row = map.get(ev.player_id)!;
    row.total_points += Number(ev.points || 0);
  }

  return Array.from(map.values())
    .filter(r => r.total_points > 0 || !seasonId) // keep zeros if you want full roster
    .sort((a, b) => b.total_points - a.total_points)
    .slice(0, limit);
}
