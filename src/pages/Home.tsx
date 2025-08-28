// src/pages/Home.tsx
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useOrg } from "@/context/OrgContext";
// using recharts directly to avoid extra wrappers
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";

export default function Home() {
  const { org } = useOrg?.() ?? { org: undefined };
  const brand = (org?.brand as any) || {};
  const primary = brand.primary || "#0ea5e9";
  const clubName = org?.name || "MVP Cricket";

  // demo spark data — harmless if you don't have DB yet
  const formSpark = useMemo(
    () =>
      [
        { x: "M1", y: 120 },
        { x: "M2", y: 160 },
        { x: "M3", y: 140 },
        { x: "M4", y: 210 },
        { x: "M5", y: 190 },
        { x: "M6", y: 230 },
        { x: "M7", y: 260 },
      ] as { x: string; y: number }[],
    []
  );

  const leaderSpark = useMemo(
    () =>
      [
        { name: "Cook", total: 420 },
        { name: "Root", total: 395 },
        { name: "Stokes", total: 360 },
        { name: "Wood", total: 300 },
        { name: "Broad", total: 270 },
      ] as { name: string; total: number }[],
    []
  );

  return (
    <div className="relative min-h-[calc(100vh-64px)]">
      {/* Soft gradient background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 600px at 20% -10%, rgba(14,165,233,0.15), transparent), radial-gradient(1000px 500px at 100% 0%, rgba(99,102,241,0.12), transparent)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-10 md:py-14">
        {/* HERO */}
        <section className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1 text-xs text-gray-600 backdrop-blur dark:bg-white/10">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: primary }} />
              Multi-tenant. Configurable. Village-club ready.
            </div>

            <h1 className="mt-4 text-3xl font-bold leading-tight md:text-5xl">
              {clubName} <span className="opacity-60">—</span> Performance Hub
            </h1>

            <p className="mt-3 max-w-xl text-sm text-gray-600 md:text-base">
              Import scorecards, tune your scoring engine, and light up your season with beautiful charts,
              leaderboards and shareable reports.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <CTA to="/analytics/season" style={{ backgroundColor: primary }}>
                Open Season Dashboard
              </CTA>
              <CTA to="/admin/import" variant="ghost">
                Import Matches
              </CTA>
              <CTA to="/demo" variant="ghost">
                Try Demo Club
              </CTA>
            </div>
          </div>

          {/* RIGHT: hero card with stats + spark */}
          <div className="mt-8 w-full max-w-md md:mt-0">
            <Glass className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Season form index</div>
                  <div className="text-2xl font-semibold">+26%</div>
                </div>
                <Badge color={primary}>Live</Badge>
              </div>
              <div className="mt-3 h-28">
                <ResponsiveContainer>
                  <AreaChart data={formSpark} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopOpacity={0.35} stopColor={primary} />
                        <stop offset="100%" stopOpacity={0} stopColor={primary} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <Tooltip />
                    <Area type="monotone" dataKey="y" stroke={primary} fill="url(#g1)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <MiniStat label="Bat pts" value="820" />
                <MiniStat label="Bowl pts" value="540" />
                <MiniStat label="Field pts" value="160" />
              </div>
            </Glass>
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <ActionCard
            title="Scoring Engine"
            description="Tune batting, bowling and fielding rules. Preview diffs, then publish."
            to="/admin/scoring"
            cta="Edit config"
            icon="⚙️"
          />
          <ActionCard
            title="Leaderboards"
            description="Top N, splits and per-player mini dashboards with one click."
            to="/analytics/season"
            cta="Open Season"
            icon="📊"
          />
          <ActionCard
            title="Onboarding"
            description="Create teams and seasons, invite captains, set your colours."
            to="/onboarding/create-club"
            cta="Finish setup"
            icon="🚀"
          />
        </section>

        {/* LEADERS PREVIEW */}
        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <Glass className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">Leaders preview</h3>
              <Link className="text-xs text-blue-600 underline" to="/analytics/season">
                View all
              </Link>
            </div>
            <div className="h-40">
              <ResponsiveContainer>
                <LineChart data={leaderSpark} margin={{ left: 0, right: 10, top: 10, bottom: 10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke={primary} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Glass>

          <Glass className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">Get started checklist</h3>
            </div>
            <ul className="space-y-2 text-sm">
              <Check>Upload a Play-Cricket PDF or CSV on the Import page</Check>
              <Check>Set your Scoring Config v1 (duck penalty, 3-for bonus, etc.)</Check>
              <Check>Open Season Dashboard and pick Top 10</Check>
              <Check>Click a player bar → mini dashboard pops up</Check>
              <Check>Export a CSV to share with the committee</Check>
            </ul>
          </Glass>
        </section>

        {/* FOOTER */}
        <footer className="mt-12 border-t pt-6 text-xs text-gray-500">
          Built for village cricket. Multi-tenant, subscription-ready.{" "}
          <Link to="/admin/exports" className="underline">
            Exports
          </Link>{" "}
          •{" "}
          <Link to="/demo" className="underline">
            Demo
          </Link>
        </footer>
      </div>
    </div>
  );
}

/* ——— UI bits ——— */

function Glass({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border bg-white/70 shadow-sm backdrop-blur dark:bg-white/10 ${className}`}>
      {children}
    </div>
  );
}

function CTA({
  to,
  children,
  variant = "solid",
  style,
}: {
  to: string;
  children: React.ReactNode;
  variant?: "solid" | "ghost";
  style?: React.CSSProperties;
}) {
  if (variant === "ghost") {
    return (
      <Link
        to={to}
        className="rounded-xl border px-4 py-2 text-sm hover:bg-white/60 dark:hover:bg-white/10"
        style={style}
      >
        {children}
      </Link>
    );
  }
  return (
    <Link
      to={to}
      className="rounded-xl px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
      style={style}
    >
      {children}
    </Link>
  );
}

function Badge({ children, color = "#0ea5e9" }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
      style={{ backgroundColor: color }}
    >
      ● {children}
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-white/60 p-3 text-center backdrop-blur dark:bg-white/10">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function ActionCard({
  title,
  description,
  to,
  cta,
  icon,
}: {
  title: string;
  description: string;
  to: string;
  cta: string;
  icon?: string;
}) {
  return (
    <Glass className="group p-5 transition hover:shadow-md">
      <div className="mb-2 flex items-center gap-2">
        <div className="text-xl">{icon}</div>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
      <div className="mt-4">
        <Link
          to={to}
          className="inline-flex items-center gap-1 text-sm text-blue-600 underline group-hover:no-underline"
        >
          {cta} →
        </Link>
      </div>
    </Glass>
  );
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 inline-block h-4 w-4 rounded-full bg-emerald-500 text-[10px] font-bold leading-4 text-white">
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}
