import { supabase } from "./supabaseClient";

export async function fetchMatchSummary(matchId: string) {
  const { data, error } = await supabase
    .from("match_summary")
    .select("*")
    .eq("match_id", matchId)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchMatchBreakdown(matchId: string) {
  const [batting, bowling] = await Promise.all([
    supabase.from("batting_innings").select("*").eq("match_id", matchId),
    supabase.from("bowling_spells").select("*").eq("match_id", matchId)
  ]);

  return { batting: batting.data || [], bowling: bowling.data || [] };
}
