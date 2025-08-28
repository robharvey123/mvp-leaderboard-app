import { createContext, useContext, useMemo, useState } from "react";

type FilterCtx = {
  seasonId?: string;
  setSeasonId: (id?: string) => void;
  teamId?: string;
  setTeamId: (id?: string) => void;
};

const Ctx = createContext<FilterCtx | null>(null);
export const useFilters = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFilters must be used within <FilterProvider>");
  return ctx;
};

export default function FilterProvider({ children }: { children: React.ReactNode }) {
  const [seasonId, setSeasonId] = useState<string | undefined>(undefined);
  const [teamId, setTeamId] = useState<string | undefined>(undefined);
  const value = useMemo(() => ({ seasonId, setSeasonId, teamId, setTeamId }), [seasonId, teamId]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}