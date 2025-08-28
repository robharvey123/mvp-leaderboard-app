// src/components/Layout.tsx
import { Link, NavLink, Outlet } from "react-router-dom";
import { Trophy, BarChart2, Upload, Settings, Users, Link2 } from "lucide-react";
import HeaderAuth from "@/components/common/HeaderAuth"; // ⬅️ add this

const nav = [
  { to: "/", label: "Overview", icon: Trophy },
  { to: "/analytics", label: "Analytics", icon: BarChart2 },
  { to: "/admin/import", label: "Import", icon: Upload },
  { to: "/admin/scoring", label: "Scoring", icon: Settings },
  { to: "/players", label: "Players", icon: Users },
  { to: "/admin/playcricket", label: "Play-Cricket", icon: Link2 },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-muted text-text-strong">
      <header className="sticky top-0 z-40 h-14 backdrop-blur bg-card/80 border-b border-brand-100 flex items-center px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-brand-500" />
          <span className="font-semibold">Club Dashboard</span>
        </Link>

        <div className="ml-auto flex items-center gap-3">
          {/* Quick access button to integration page */}
          <Link
            to="/admin/playcricket"
            className="px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition"
          >
            Play-Cricket
          </Link>

          {/* Auth area (Sign in when logged out; AuthMenu when logged in) */}
          <HeaderAuth />
        </div>
      </header>

      <div className="grid grid-cols-[240px_1fr]">
        <aside className="min-h-[calc(100vh-56px)] border-r border-brand-100 bg-card p-2">
          <nav className="space-y-1">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-brand-50 ${
                    isActive ? "bg-brand-100 text-brand-800" : "text-text-soft"
                  }`
                }
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
