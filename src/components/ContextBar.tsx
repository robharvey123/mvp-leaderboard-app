// src/components/ContextBar.tsx
import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

type Opt = { id: string; name: string };

export default function ContextBar() {
  const [params, setParams] = useSearchParams();

  const clubIdParam   = params.get("clubId")   || "";
  const seasonIdParam = params.get("seasonId") || "";
  const teamIdParam   = params.get("teamId")   || "";

  const [clubs, setClubs] = useState<Opt[]>([]);
  const [seasons, setSeasons] = useState<Opt[]>([]);
  const [teams, setTeams] = useState<Opt[]>([]);
  const [loading, setLoading] = useState({ clubs: false, seasons: false, teams: false });

  const setParam = (k: string, v: string) =>
    setParams(prev => {
      const next = new URLSearchParams(prev);
      if (v) next.set(k, v); else next.delete(k);
      return next;
    }, { replace: true });

  // ---- Load data
  useEffect(() => {
    let off = false;
    (async () => {
      setLoading(s => ({ ...s, clubs: true }));
      const { data } = await supabase.from("clubs").select("id,name").order("name");
      if (!off) {
        setClubs((data ?? []) as Opt[]);
        setLoading(s => ({ ...s, clubs: false }));
      }
    })();
    return () => { off = true; };
  }, []);

  useEffect(() => {
    if (!clubIdParam) { setSeasons([]); setTeams([]); return; }
    let off = false;

    (async () => {
      setLoading(s => ({ ...s, seasons: true }));
      // If your seasons are not per-club, this still works — we’ll fall back to all seasons.
      let q = supabase.from("seasons").select("id,name,club_id,start_date").order("start_date", { ascending: false });
      let { data, error } = await q.eq("club_id", clubIdParam);
      if (!error && (!data || data.length === 0)) {
        // fallback: global seasons table
        ({ data } = await q); // without club filter
      }
      if (!off) {
        setSeasons((data ?? []).map((r: any) => ({ id: r.id, name: r.name })) as Opt[]);
        setLoading(s => ({ ...s, seasons: false }));
      }
    })();

    (async () => {
      setLoading(s => ({ ...s, teams: true }));
      let q = supabase.from("teams").select("id,name,club_id").order("name");
      let { data, error } = await q.eq("club_id", clubIdParam);
      if (!error && (!data || data.length === 0)) {
        // fallback: any teams (for schemas without club_id)
        ({ data } = await q);
      }
      if (!off) {
        setTeams((data ?? []) as Opt[]);
        setLoading(s => ({ ...s, teams: false }));
      }
    })();

    return () => { off = true; };
  }, [clubIdParam]);

  // ---- Seed params once lists are available
  useEffect(() => { if (!clubIdParam && clubs.length) setParam("clubId", clubs[0].id); }, [clubIdParam, clubs]);
  useEffect(() => { if (clubIdParam && !seasonIdParam && seasons.length) setParam("seasonId", seasons[0].id); }, [clubIdParam, seasonIdParam, seasons]);
  useEffect(() => { if (clubIdParam && !teamIdParam && teams.length) setParam("teamId", teams[0].id); }, [clubIdParam, teamIdParam, teams]);

  // ---- Effective IDs (use URL first, else first option)
  const clubId   = clubIdParam   || (clubs[0]?.id   ?? "");
  const seasonId = seasonIdParam || (seasons[0]?.id ?? "");
  const teamId   = teamIdParam   || (teams[0]?.id   ?? "");

  // ---- Handlers (sync to URL)
  const onClubChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setParam("clubId", id);
    setParam("seasonId", "");
    setParam("teamId", "");
  };
  const onSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => setParam("seasonId", e.target.value);
  const onTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => setParam("teamId", e.target.value);

  // ---- Links always computed from effective IDs
  const seasonLbHref = useMemo(() => {
    if (!clubId || !seasonId) return "#";
    const sp = new URLSearchParams({ clubId, seasonId });
    return `/leaderboard/season?${sp.toString()}`;
  }, [clubId, seasonId]);

  const teamLbHref = useMemo(() => {
    if (!clubId || !seasonId || !teamId) return "#";
    const sp = new URLSearchParams({ clubId, seasonId, teamId });
    return `/leaderboard/team?${sp.toString()}`;
  }, [clubId, seasonId, teamId]);

  const seasonReady = !!clubId && !!seasonId;
  const teamReady = !!clubId && !!seasonId && !!teamId;

  return (
    <div className="w-full rounded-2xl bg-white dark:bg-neutral-900 border px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-xs uppercase text-neutral-500">Context</span>

        {/* Club */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">Club</span>
          <select
            className="rounded-lg border px-3 py-1.5"
            value={clubId}
            onChange={onClubChange}
            disabled={loading.clubs || clubs.length === 0}
          >
            {!clubId && <option value="">Select…</option>}
            {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Season */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">Season</span>
          <select
            className="rounded-lg border px-3 py-1.5"
            value={seasonId}
            onChange={onSeasonChange}
            disabled={!clubId || loading.seasons || seasons.length === 0}
          >
            {!seasonId && <option value="">Select…</option>}
            {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Team */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">Team</span>
          <select
            className="rounded-lg border px-3 py-1.5"
            value={teamId}
            onChange={onTeamChange}
            disabled={!clubId || loading.teams || teams.length === 0}
          >
            {!teamId && <option value="">Select…</option>}
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {/* Quick links — now live as soon as we have effective IDs */}
      <div className="flex items-center gap-2">
        <Link
          to={seasonLbHref}
          className={`px-3 py-1.5 rounded-lg ${seasonReady ? "bg-black text-white" : "bg-neutral-300 text-neutral-700"}`}
        >
          Season LB
        </Link>
        <Link
          to={teamLbHref}
          className={`px-3 py-1.5 rounded-lg ${teamReady ? "bg-neutral-800 text-white" : "bg-neutral-300 text-neutral-700"}`}
        >
          Team LB
        </Link>
      </div>
    </div>
  );
}
