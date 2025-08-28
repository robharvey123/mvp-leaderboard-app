// src/context/OrgContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type Org = {
  id: string;
  name: string;
  slug: string;
  brand?: { primary?: string; secondary?: string; logo_url?: string };
};

export type Season = {
  id: string;
  club_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

type OrgCtx = {
  // current selection
  org?: Org;
  clubId?: string;
  seasonId?: string;
  // data
  myOrgs: Org[];
  mySeasons: Season[];
  // actions
  setOrg: (o?: Org) => void;
  setSeasonId: (id?: string) => void;
  reload: () => void;
};

const Ctx = createContext<OrgCtx>({
  setOrg: () => {},
  setSeasonId: () => {},
  myOrgs: [],
  mySeasons: [],
  reload: () => {},
});

export function useOrg() {
  return useContext(Ctx);
}

const LS_ORG = "mvp:selected_org_id";
const LS_SEASON = "mvp:selected_season_id";

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [org, _setOrg] = useState<Org | undefined>(undefined);
  const [myOrgs, setMyOrgs] = useState<Org[]>([]);
  const [mySeasons, setMySeasons] = useState<Season[]>([]);
  const [seasonId, _setSeasonId] = useState<string | undefined>(undefined);

  const clubId = org?.id;

  // Load orgs the signed-in user belongs to
  async function loadOrgs() {
    // Expect FK user_org_roles.club_id -> clubs.id
    const { data, error } = await supabase
      .from("user_org_roles")
      .select("club_id, clubs:club_id(id, name, slug, brand)")
      .order("club_id", { ascending: true });
    if (error) {
      // eslint-disable-next-line no-console
      console.warn("[OrgContext] loadOrgs error", error);
      setMyOrgs([]);
      return;
    }
    const list: Org[] = (data || [])
      .map((r: any) => r?.clubs)
      .filter(Boolean)
      .map((c: any) => ({ id: c.id, name: c.name, slug: c.slug, brand: c.brand || {} }));

    setMyOrgs(list);

    // Select last chosen org or first available
    const saved = localStorage.getItem(LS_ORG);
    const bySaved = list.find((o) => o.id === saved);
    _setOrg(bySaved || list[0] || undefined);
  }

  // Load seasons for selected org
  async function loadSeasons(selectedClubId?: string) {
    if (!selectedClubId) {
      setMySeasons([]);
      _setSeasonId(undefined);
      return;
    }
    const { data, error } = await supabase
      .from("seasons")
      .select("*")
      .eq("club_id", selectedClubId)
      .order("start_date", { ascending: false });
    if (error) {
      // eslint-disable-next-line no-console
      console.warn("[OrgContext] loadSeasons error", error);
      setMySeasons([]);
      _setSeasonId(undefined);
      return;
    }
    const seasons = (data || []) as Season[];
    setMySeasons(seasons);

    // prefer saved season, else active, else latest
    const saved = localStorage.getItem(LS_SEASON) || "";
    const fromSaved = seasons.find((s) => s.id === saved);
    const active = seasons.find((s) => s.is_active);
    _setSeasonId(fromSaved?.id || active?.id || seasons[0]?.id || undefined);
  }

  // Initial load
  useEffect(() => {
    loadOrgs();
  }, []);

  // When org changes, persist + load its seasons
  useEffect(() => {
    if (org?.id) {
      localStorage.setItem(LS_ORG, org.id);
    }
    loadSeasons(org?.id);
  }, [org?.id]);

  // Apply theme tokens from org.brand (optional)
  useEffect(() => {
    const root = document.documentElement;
    const primary = org?.brand?.primary;   // e.g. "#0ea5e9"
    const secondary = org?.brand?.secondary;
    if (primary) root.style.setProperty("--brand-hex", primary);
    if (secondary) root.style.setProperty("--brand-hex-2", secondary);
  }, [org?.brand?.primary, org?.brand?.secondary]);

  const setOrg = (o?: Org) => {
    _setOrg(o);
  };
  const setSeasonId = (id?: string) => {
    _setSeasonId(id);
    if (id) localStorage.setItem(LS_SEASON, id);
  };
  const reload = () => {
    loadOrgs();
    loadSeasons(org?.id);
  };

  const value = useMemo<OrgCtx>(
    () => ({
      org,
      clubId,
      seasonId,
      myOrgs,
      mySeasons,
      setOrg,
      setSeasonId,
      reload,
    }),
    [org, clubId, seasonId, myOrgs, mySeasons]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// Keep a default export to avoid breaking any default imports elsewhere
export default OrgProvider;
