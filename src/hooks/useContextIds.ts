import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

export type ContextIds = {
  clubId: string;
  seasonId: string;
  teamId: string;
  setClubId: (v?: string) => void;
  setSeasonId: (v?: string) => void;
  setTeamId: (v?: string) => void;
  setMany: (next: Partial<Pick<ContextIds, "clubId" | "seasonId" | "teamId">>) => void;
};

/**
 * Single source of truth for clubId/seasonId/teamId stored in the URL.
 * Pages/components can read & set without duplicating logic.
 */
export default function useContextIds(): ContextIds {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const clubId = params.get("clubId") || "";
  const seasonId = params.get("seasonId") || "";
  const teamId = params.get("teamId") || "";

  const setParam = useCallback(
    (key: "clubId" | "seasonId" | "teamId", value?: string) => {
      const p = new URLSearchParams(params);
      if (!value) p.delete(key);
      else p.set(key, value);
      navigate({ pathname, search: p.toString() }, { replace: true });
    },
    [navigate, pathname, params]
  );

  const setClubId = useCallback((v?: string) => setParam("clubId", v), [setParam]);
  const setSeasonId = useCallback((v?: string) => setParam("seasonId", v), [setParam]);
  const setTeamId = useCallback((v?: string) => setParam("teamId", v), [setParam]);

  const setMany = useCallback(
    (next: Partial<Pick<ContextIds, "clubId" | "seasonId" | "teamId">>) => {
      const p = new URLSearchParams(params);
      if (next.clubId !== undefined) {
        next.clubId ? p.set("clubId", next.clubId) : p.delete("clubId");
      }
      if (next.seasonId !== undefined) {
        next.seasonId ? p.set("seasonId", next.seasonId) : p.delete("seasonId");
      }
      if (next.teamId !== undefined) {
        next.teamId ? p.set("teamId", next.teamId) : p.delete("teamId");
      }
      navigate({ pathname, search: p.toString() }, { replace: true });
    },
    [navigate, pathname, params]
  );

  return useMemo(
    () => ({ clubId, seasonId, teamId, setClubId, setSeasonId, setTeamId, setMany }),
    [clubId, seasonId, teamId, setClubId, setSeasonId, setTeamId, setMany]
  );
}
