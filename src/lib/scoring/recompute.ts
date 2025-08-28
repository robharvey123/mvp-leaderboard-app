import { supabase } from "@/lib/supabaseClient";
import type { Formula } from "./engine";
import { calcBattingPoints, calcBowlingPoints } from "./engine";

// Small helpers
const nz = (v: any, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d;

export async function getActiveFormula(clubId: string, seasonId?: string): Promise<{ id: string; formula: Formula } | null> {
  // Prefer season override; else fall back to club-global
  const { data, error } = await supabase
    .from("scoring_configs")
    .select("id, formula_json, season_id, is_active")
    .eq("club_id", clubId)
    .eq("is_active", true)
    .order("season_id", { ascending: false })
    .limit(10);
  if (error) throw error;
  if (!data?.length) return null;

  const seasonHit = data.find(d => d.season_id === seasonId);
  const chosen = seasonHit ?? data[0];
  return { id: chosen.id, formula: chosen.formula_json as Formula };
}

export type RecomputeResult = { matches: number; eventsInserted: number };

export async function recomputeSeasonPoints(params: {
  clubId: string;
  start: string; // ISO "YYYY-MM-DD"
  end: string;   // ISO "YYYY-MM-DD"
  seasonId?: string;
}): Promise<RecomputeResult> {
  const { clubId, start, end, seasonId } = params;

  const cfg = await getActiveFormula(clubId, seasonId);
  if (!cfg) throw new Error("No active scoring config found for this club/season.");
  const configId = cfg.id;
  const formula = cfg.formula;

  // 1) Find matches in season for this club
  const { data: matches, error: mErr } = await supabase
    .from("matches")
    .select("id, team_id, match_date")
    .eq("club_id", clubId)
    .gte("match_date", start)
    .lte("match_date", end)
    .order("match_date");
  if (mErr) throw mErr;
  const matchIds = (matches ?? []).map(m => m.id);
  if (matchIds.length === 0) return { matches: 0, eventsInserted: 0 };

  // 2) Pull batting/bowling/fielding cards for those matches
  const [batRes, bowlRes, fieldRes] = await Promise.all([
    supabase.from("batting_cards").select("match_id, player_id, runs, balls, fours, sixes, dismissal").in("match_id", matchIds),
    supabase.from("bowling_cards").select("match_id, player_id, overs, maidens, runs, wickets").in("match_id", matchIds),
    supabase.from("fielding_cards").select("match_id, player_id, catches, stumpings, runouts, drops, misfields").in("match_id", matchIds),
  ]);
  if (batRes.error) throw batRes.error;
  if (bowlRes.error) throw bowlRes.error;
  if (fieldRes.error) throw fieldRes.error;

  // 3) Build points_events rows
  type Ev = { match_id: string; player_id: string; config_id: string; metric: string; value: number; points: number };
  const events: Ev[] = [];

  // Batting per-innings + milestones + duck
  for (const r of batRes.data ?? []) {
    const runs = nz(r.runs), balls = nz(r.balls), fours = nz(r.fours), sixes = nz(r.sixes);
    const pts = calcBattingPoints(formula.batting, {
      runs, balls, fours, sixes, dismissal: r.dismissal || undefined,
    });
    if (pts !== 0) events.push({ match_id: r.match_id, player_id: r.player_id, config_id: configId, metric: "batting_total", value: runs, points: pts });
  }

  // Bowling wickets/maidens/economy bands + 3-for / 5-for bonuses
  for (const r of bowlRes.data ?? []) {
    const overs = nz(r.overs), maidens = nz(r.maidens), runs = nz(r.runs), wickets = nz(r.wickets);
    const pts = calcBowlingPoints(formula.bowling, { overs, maidens, runs, wickets });
    if (pts !== 0) events.push({ match_id: r.match_id, player_id: r.player_id, config_id: configId, metric: "bowling_total", value: wickets, points: pts });
  }

  // Fielding catches/stumpings/runouts/drops/misfields
  for (const r of fieldRes.data ?? []) {
    const f = formula.fielding;
    const parts: Ev[] = [];
    if (nz(r.catches)    ) parts.push({ match_id: r.match_id, player_id: r.player_id, config_id: configId, metric: "catch",         value: r.catches,    points: nz(r.catches)    * f.catch });
    if (nz(r.stumpings)  ) parts.push({ match_id: r.match_id, player_id: r.player_id, config_id: configId, metric: "stumping",      value: r.stumpings,  points: nz(r.stumpings)  * f.stumping });
    if (nz(r.runouts)    ) parts.push({ match_id: r.match_id, player_id: r.player_id, config_id: configId, metric: "runout",        value: r.runouts,    points: nz(r.runouts)    * f.runout });
    if (nz(r.drops)      ) parts.push({ match_id: r.match_id, player_id: r.player_id, config_id: configId, metric: "drop_penalty",  value: r.drops,      points: -Math.abs(nz(r.drops)     * Math.abs(f.drop_penalty)) });
    if (nz(r.misfields)  ) parts.push({ match_id: r.match_id, player_id: r.player_id, config_id: configId, metric: "misfield",      value: r.misfields,  points: -Math.abs(nz(r.misfields) * Math.abs(f.misfield_penalty)) });
    events.push(...parts.filter(e => e.points !== 0));
  }

  // 4) Replace existing points_events for these matches + config
  //    (simple approach: delete + insert)
  const { error: delErr } = await supabase
    .from("points_events")
    .delete()
    .in("match_id", matchIds)
    .eq("config_id", configId);
  if (delErr) throw delErr;

  // Batch insert in chunks to avoid payload limits
  const chunk = 500;
  for (let i = 0; i < events.length; i += chunk) {
    const slice = events.slice(i, i + chunk);
    const { error: insErr } = await supabase.from("points_events").insert(slice);
    if (insErr) throw insErr;
  }

  return { matches: matchIds.length, eventsInserted: events.length };
}
