// --- src/components/OrgSwitcher.tsx ------------------------------------------------
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/context/OrgContext";

interface Club { id: string; name: string; slug: string; brand?: any }
interface Season { id: string; name: string; is_active: boolean }
interface Team { id: string; name: string; competition?: string }

export default function OrgSwitcher() {
  const { org, setOrg } = useOrg();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    loadClubs();
  }, []);

  async function loadClubs() {
    const { data } = await supabase
      .from("user_org_roles")
      .select("club_id, clubs:club_id(id,name,slug,brand)");
    setClubs((data || []).map((r: any) => r.clubs));
  }

  async function loadSeasons(clubId: string) {
    const { data } = await supabase.from("seasons").select("id,name,is_active").eq("club_id", clubId);
    setSeasons(data || []);
  }

  async function loadTeams(clubId: string) {
    const { data } = await supabase.from("teams").select("id,name,competition").eq("club_id", clubId);
    setTeams(data || []);
  }

  function handleClubChange(e: any) {
    const id = e.target.value;
    const c = clubs.find(c => c.id === id);
    if (c) setOrg(c);
    loadSeasons(id);
    loadTeams(id);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <select value={org?.id || ""} onChange={handleClubChange} className="rounded-xl border px-2 py-1">
        <option value="">Select Club…</option>
        {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      {seasons.length > 0 && (
        <select className="rounded-xl border px-2 py-1">
          {seasons.map(s => <option key={s.id} value={s.id}>{s.name}{s.is_active ? " (active)" : ""}</option>)}
        </select>
      )}
      {teams.length > 0 && (
        <select className="rounded-xl border px-2 py-1">
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      )}
    </div>
  );
}

// --- src/layouts/AdminLayout.tsx (modified to include switcher + badge) --------
import { NavLink, Outlet } from "react-router-dom";
import { Menu, Settings, Shield, Trophy, Wrench, Link2, Gauge, ListOrdered, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import OrgSwitcher from "@/components/OrgSwitcher";

function Item({ to, icon: Icon, label, badge }: { to: string; icon: any; label: string; badge?: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => [
        "flex items-center justify-between rounded-xl px-3 py-2 text-sm",
        isActive ? "bg-black text-white" : "text-neutral-700 hover:bg-neutral-100",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4"/>
        <span>{label}</span>
      </div>
      {badge}
    </NavLink>
  );
}

export default function AdminLayout() {
  const [open, setOpen] = useState(true);
  const [pcConnected, setPcConnected] = useState(false);

  useEffect(() => {
    // TODO: fetch real Play‑Cricket connection status from Supabase
    setTimeout(()=>setPcConnected(true), 500); // mocked connected
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={()=>setOpen(v=>!v)} className="rounded-xl border px-2 py-1.5"><Menu className="h-4 w-4"/></button>
          <h1 className="text-base font-semibold">Admin</h1>
          <OrgSwitcher />
        </div>
        <div className="flex items-center gap-3 text-sm text-neutral-500">
          {pcConnected ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5"/> Play‑Cricket Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
              <AlertCircle className="h-3.5 w-3.5"/> Play‑Cricket Not Connected
            </span>
          )}
          <span className="hidden sm:inline">MVP Cricket</span>
          <span className="rounded-full bg-neutral-100 px-2 py-1">v0.1</span>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className={["border-r bg-white p-3", open ? "block" : "hidden md:block"].join(" ")}> 
          <nav className="space-y-6">
            <div>
              <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Overview</div>
              <div className="grid gap-1">
                <Item to="/admin" icon={Gauge} label="Dashboard" />
                <Item to="/admin/teams" icon={ListOrdered} label="Teams & Seasons" />
              </div>
            </div>
            <div>
              <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Config</div>
              <div className="grid gap-1">
                <Item to="/admin/scoring" icon={Trophy} label="Scoring" />
                <Item to="/admin/integrations/play-cricket" icon={Link2} label="Play‑Cricket" badge={pcConnected ? <CheckCircle2 className="h-4 w-4 text-emerald-600"/> : <AlertCircle className="h-4 w-4 text-amber-500"/>} />
                <Item to="/admin/settings" icon={Settings} label="Settings" />
              </div>
            </div>
            <div>
              <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Security</div>
              <div className="grid gap-1">
                <Item to="/admin/roles" icon={Shield} label="Roles & Access" />
                <Item to="/admin/tools" icon={Wrench} label="Tools" />
              </div>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
