// src/pages/TeamLeaderboardPage.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import useContextIds from "@/hooks/useContextIds";
import useSeasonBounds from "@/hooks/useSeasonBounds";
import { downloadCsv } from "@/lib/export/toCsv";

type Row = { player_id: string; full_name: string; total_points: number };

export default function TeamLeaderboardPage() {
  const { clubId, seasonId, teamId } = useContextIds();
  const { start, end, loading: boundsLoading, error: boundsError } = useSeasonBounds(seasonId);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!clubId || !seasonId || !teamId || !start || !end) return;
      setLoading(true);
      setError(null);

      try {
        // 1) Squad for this team; fallback to all club players if no squad rows
        let playerIds: string[] = [];
        const { data: squad, error: sErr } = await supabase
          .from("squads")
          .select("player_id")
          .eq("team_id", teamId);
        if (sErr) throw sErr;

        if (squad?.length) {
          playerIds = squad.map((r: any) => r.player_id);
        } else {
          const { data: ps, error: pErr } = await supabase
            .from("players")
            .select("id")
            .eq("club_id", clubId);
          if (pErr) throw pErr;
          playerIds = (ps ?? []).map((p: any) => p.id);
        }

        if (playerIds.length === 0) {
          setRows([]);
          setLoading(false);
          return;
        }

        // 2) Matches for this club within season window
        const { data: matches, error: mErr } = await supabase
          .from("matches")
          .select("id")
          .eq("club_id", clubId)
          .gte("played_on", start)   // ← if your date field is match_date, swap both lines to match_date
          .lte("played_on", end);
        if (mErr) throw mErr;
        const matchIds = (matches ?? []).map((m: any) => m.id);
        if (matchIds.length === 0) {
          setRows([]);
          setLoading(false);
          return;
        }

        // 3) Points events for those matches & players → totals per player
        const { data: events, error: eErr } = await supabase
          .from("points_events")
          .select("player_id, points, match_id")
          .in("match_id", matchIds)
          .in("player_id", playerIds);
        if (eErr) throw eErr;

        // 4) Names for display
        const { data: players, error: p2Err } = await supabase
          .from("players")
          .select("id, full_name")
          .in("id", playerIds);
        if (p2Err) throw p2Err;
        const nameById = new Map<string, string>((players ?? []).map((p: any) => [p.id, p.full_name]));

        const totals = new Map<string, number>();
        for (const ev of events ?? []) {
          const pid = (ev as any).player_id as string;
          totals.set(pid, (totals.get(pid) || 0) + Number((ev as any).points || 0));
        }

        const table: Row[] = Array.from(totals.entries())
          .map(([player_id, total_points]) => ({
            player_id,
            total_points,
            full_name: nameById.get(player_id) || player_id.slice(0, 8),
          }))
          .sort((a, b) => b.total_points - a.total_points);

        setRows(table);
      } catch (err: any) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [clubId, seasonId, teamId, start, end]);

  const onExport = () => {
    downloadCsv(
      [
        ["Rank", "Player", "Points"],
        ...rows.map((r, i) => [String(i + 1), r.full_name, String(Math.round(r.total_points))]),
      ],
      "team_leaderboard.csv"
    );
  };

  // UI states
  if (!clubId || !seasonId) return <div className="p-6 text-sm text-neutral-600">Pick a Club & Season in the Context Bar.</div>;
  if (!teamId) return <div className="p-6 text-sm text-neutral-600">Pick a Team in the Context Bar.</div>;
  if (boundsLoading) return <div className="p-6">Loading season…</div>;
  if (boundsError) return <div className="p-6 text-red-600">Season error: {boundsError}</div>;
  if (loading) return <div className="p-6">Loading leaderboard…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (rows.length === 0) return <div className="p-6 text-sm text-neutral-600">No points for this team in the selected season.</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Team Leaderboard</h1>
        <button onClick={onExport} className="px-3 py-1.5 rounded bg-black text-white">
          Export CSV
        </button>
      </div>

      <table className="min-w-full border rounded">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 text-left">#</th>
            <th className="px-3 py-2 text-left">Player</th>
            <th className="px-3 py-2 text-right">Points</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.player_id} className="border-t">
              <td className="px-3 py-2">{i + 1}</td>
              <td className="px-3 py-2">{r.full_name}</td>
              <td className="px-3 py-2 text-right">{Math.round(r.total_points)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
