// src/pages/HomePage.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  BarChart3,
  Users,
  Settings,
  Gauge,
  TrendingUp,
  Sparkles,
  ExternalLink,
  ArrowRight,
  Target,
} from "lucide-react";

/** Home / Landing */
export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl">
        {/* gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--brand-700))] via-[rgb(var(--brand-600))] to-[rgb(var(--brand-400))]" />
        {/* subtle light blobs */}
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        {/* content */}
        <div className="relative px-6 py-10 md:px-10 md:py-14 text-white">
          <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-10">
            <div className="flex-1 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm backdrop-blur-sm">
                <Sparkles size={16} />
                <span>Cricket Club MVP</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
                Welcome to your <span className="opacity-90">MVP Leaderboard</span>
              </h1>
              <p className="max-w-2xl text-white/85">
                Track form, celebrate stars, and tune how points are earned. Dive into analytics or tweak the scoring engine—your club, your rules.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <PrimaryButton to="/analytics/club" icon={BarChart3}>
                  View Club Overview
                </PrimaryButton>
                <GhostButton to="/admin/scoring" icon={Settings}>
                  Scoring Engine
                </GhostButton>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3 md:gap-4 w-full md:w-auto">
              <KpiCard label="Season points" value="12,480" icon={Gauge} />
              <KpiCard label="Win rate" value="68%" icon={TrendingUp} />
              <KpiCard label="Top scorer" value="R. Harvey" icon={Trophy} />
              <KpiCard label="Avg RPO" value="5.7" icon={Target} />
            </div>
          </div>
        </div>
      </section>

      {/* QUICK NAV */}
      <section className="grid md:grid-cols-3 gap-4">
        <NavCard
          to="/analytics/season"
          title="Season Dashboard"
          subtitle="Form, trends, and leaders at a glance"
          icon={Trophy}
          tone="brand"
        />
        <NavCard
          to="/analytics/team"
          title="Team Stats"
          subtitle="Batting, bowling, and fielding splits"
          icon={BarChart3}
        />
        <NavCard
          to="/analytics/players"
          title="Player Explorer"
          subtitle="Search & compare players across seasons"
          icon={Users}
        />
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <NavCard
          to="/analytics/categories"
          title="Category Breakdown"
          subtitle="Points by batting, bowling, fielding"
          icon={Gauge}
        />
        <NavCard
          to="/admin/scoring"
          title="Scoring Engine"
          subtitle="Tune rules & save versioned configs"
          icon={Settings}
          tone="brand"
        />
        <ExternalCard
          href="https://play-cricket.com"
          title="Play-Cricket"
          subtitle="Fixtures, results & league tables"
          icon={ExternalLink}
        />
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Pieces                                   */
/* -------------------------------------------------------------------------- */

function PrimaryButton({ to, icon: Icon, children }: { to: string; icon?: React.ComponentType<any>; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-2 rounded-2xl px-4 py-2.5
                 bg-white text-[rgb(var(--brand-700))] hover:bg-white/90
                 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-white/70"
    >
      {Icon ? <Icon size={18} /> : null}
      <span className="font-medium">{children}</span>
      <ArrowRight size={16} className="transition -mr-1 group-hover:translate-x-0.5" />
    </Link>
  );
}

function GhostButton({ to, icon: Icon, children }: { to: string; icon?: React.ComponentType<any>; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-2 rounded-2xl px-4 py-2.5
                 border border-white/40 text-white hover:bg-white/10
                 backdrop-blur-sm transition focus:outline-none focus:ring-2 focus:ring-white/50"
    >
      {Icon ? <Icon size={18} /> : null}
      <span className="font-medium">{children}</span>
      <ArrowRight size={16} className="transition -mr-1 group-hover:translate-x-0.5" />
    </Link>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon?: React.ComponentType<any>;
}) {
  return (
    <div
      className="rounded-2xl border border-white/25 bg-white/15 text-white p-3 md:p-4
                 shadow-sm backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-wide text-white/80">{label}</div>
        {Icon ? <Icon size={16} className="opacity-90" /> : null}
      </div>
      <div className="mt-1 text-xl md:text-2xl font-extrabold">{value}</div>
    </div>
  );
}

function NavCard({
  to,
  title,
  subtitle,
  icon: Icon,
  tone,
}: {
  to: string;
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<any>;
  tone?: "brand";
}) {
  const toneClasses =
    tone === "brand"
      ? "bg-[rgb(var(--brand-50))]/70 border-[rgb(var(--brand-200))] hover:bg-[rgb(var(--brand-50))]"
      : "bg-white border-brand-100 hover:bg-brand-50/50";

  return (
    <Link
      to={to}
      className={[
        "group relative rounded-2xl border p-4 transition shadow-sm",
        "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-300))]",
        toneClasses,
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl p-2 bg-black/5 group-hover:bg-black/10 transition">
          {Icon ? <Icon size={18} /> : null}
        </div>
        <div>
          <div className="text-base font-semibold">{title}</div>
          {subtitle ? <div className="text-sm text-text-soft">{subtitle}</div> : null}
        </div>
      </div>
      <ArrowRight
        size={16}
        className="absolute right-4 top-4 opacity-50 group-hover:opacity-100 transition group-hover:translate-x-0.5"
      />
    </Link>
  );
}

function ExternalCard({
  href,
  title,
  subtitle,
  icon: Icon,
}: {
  href: string;
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<any>;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group relative rounded-2xl border border-brand-100 bg-white p-4 transition shadow-sm
                 hover:bg-brand-50/50 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-300))]"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl p-2 bg-black/5 group-hover:bg-black/10 transition">
          {Icon ? <Icon size={18} /> : null}
        </div>
        <div>
          <div className="text-base font-semibold">{title}</div>
          {subtitle ? <div className="text-sm text-text-soft">{subtitle}</div> : null}
        </div>
      </div>
      <ExternalLink
        size={16}
        className="absolute right-4 top-4 opacity-50 group-hover:opacity-100 transition group-hover:translate-x-0.5"
        aria-hidden
      />
    </a>
  );
}
