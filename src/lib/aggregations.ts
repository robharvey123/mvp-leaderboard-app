import { supabase } from "@/lib/supabaseClient";

export type PlayerTotals = {
  playerId: string;
  name: string;
  bat: number;
  bowl: number;
  field: number;
  total: number;
  series: { date: string; bat: number; bowl: number; field: number; total: number; teamId?: string }[];
};

export type TeamTotals = { teamId: string; name: string; bat: number; bowl: number; field: number; total: number };

function metricGroup(metric: string): "bat" | "bowl" | "field" {
  const m = metric.toLowerCase();
  if (m.includes("catch") || m.includes("stump") || m.includes("runout") || m.includes("drop") || m.includes("misfield")) return "field";
  if (m.includes("wicket") || m.includes("maiden") || m.includes("three_for") || m.includes("five_for") || m.includes("economy")) return "bowl";
  return "bat"; // defaults like runs, boundaries, 50/100, duck
}

export async function getSeasonWindow(seasonId: string) {
  const { data, error } = await supabase.from("seasons").select("start_date,end_date").eq("id", seasonId).maybeSingle();
  if (error || !data) return null;
  return { start: data.start_date as string, end: data.end_date as string };
}

export async function fetchPlayerTotals(seasonId: string, opts?: { teamId?: string }) {
  const win = await getSeasonWindow(seasonId);
  if (!win) return { players: [] as PlayerTotals[], teams: [] as TeamTotals[] };

  // Points events + joined match for date/team grouping
  const { data } = await supabase
    .from("points_events")
    .select(`player_id, metric, points, match:match_id(match_date, team_id), players:player_id(full_name)`)
    .gte("match.match_date", win.start)
    .lte("match.match_date", win.end);

  const byPlayer = new Map<string, PlayerTotals>();
  const byTeam = new Map<string, TeamTotals>();

  (data as any[] | null || []).forEach((row) => {
    if (opts?.teamId && row.match?.team_id !== opts.teamId) return;
    const pid = row.player_id as string;
    const name = row.players?.full_name || "Player";
    const teamId = row.match?.team_id as string | undefined;
    const date = row.match?.match_date as string;
    const grp = metricGroup(row.metric as string);
    const pts = Number(row.points) || 0;

    if (!byPlayer.has(pid)) byPlayer.set(pid, { playerId: pid, name, bat: 0, bowl: 0, field: 0, total: 0, series: [] });
    const p = byPlayer.get(pid)!;
    p[grp] += pts;
    p.total += pts;
    // push into series bucket per match
    p.series.push({ date, bat: grp === "bat" ? pts : 0, bowl: grp === "bowl" ? pts : 0, field: grp === "field" ? pts : 0, total: pts, teamId });

    if (teamId) {
      if (!byTeam.has(teamId)) byTeam.set(teamId, { teamId, name: teamId, bat: 0, bowl: 0, field: 0, total: 0 });
      const t = byTeam.get(teamId)!;
      t[grp] += pts;
      t.total += pts;
    }
  });

  // Name lookup for teams
  const teamIds = Array.from(byTeam.keys());
  if (teamIds.length) {
    const { data: teams } = await supabase.from("teams").select("id,name").in("id", teamIds);
    (teams || []).forEach((t: any) => {
      const cur = byTeam.get(t.id);
      if (cur) cur.name = t.name;
    });
  }

  // Sort players by total desc
  const players = Array.from(byPlayer.values()).sort((a, b) => b.total - a.total);
  const teams = Array.from(byTeam.values()).sort((a, b) => b.total - a.total);
  return { players, teams };
}