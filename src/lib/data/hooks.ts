import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type PlayerTotal = {
  club_id: string;
  season_id: string;
  player_id: string;
  name: string;
  total: number;
  batting: number;
  bowling: number;
  fielding: number;
  penalty: number;
};

export type TeamStats = {
  club_id: string;
  season_id: string;
  runs: number; fifties: number; hundreds: number; fours: number; sixes: number;
  wickets: number; fiveFors: number; maidens: number;
  catches: number; runouts: number; assists: number; stumpings: number;
  ducks: number; drops: number;
};

export function usePlayerLeaderboard(clubId?: string | null, seasonId?: string | null) {
  const [data, setData] = useState<PlayerTotal[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!clubId || !seasonId) { setData([]); setLoading(false); return; }
      const { data, error } = await supabase
        .from("player_totals_view")
        .select("*")
        .eq("club_id", clubId)
        .eq("season_id", seasonId)
        .order("total", { ascending: false });
      if (!alive) return;
      if (error) { setErr(error.message); setData([]); }
      else setData(data as PlayerTotal[]);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [clubId, seasonId]);

  return { data, loading, error };
}

export function useTeamStats(clubId?: string | null, seasonId?: string | null) {
  const [data, setData] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!clubId || !seasonId) { setData(null); setLoading(false); return; }
      const { data, error } = await supabase
        .from("team_stats_view")
        .select("*")
        .eq("club_id", clubId)
        .eq("season_id", seasonId)
        .maybeSingle();
      if (!alive) return;
      if (error) setErr(error.message);
      else setData(data as TeamStats);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [clubId, seasonId]);

  return { data, loading, error };
}
