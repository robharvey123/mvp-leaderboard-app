// src/components/SidebarLayout.tsx
import { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import SidebarNav from "@/components/SidebarNav";
import AuthMenu from "@/components/auth/AuthMenu";
import OrgSwitcher from "@/components/OrgSwitcher";

export default function SidebarLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="h-14 px-3 md:px-4 flex items-center gap-3">
          {/* Mobile: open sidebar */}
          <button
            className="md:hidden inline-flex items-center justify-center rounded-lg border border-gray-200 w-9 h-9 hover:bg-gray-50"
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
          >
            <Menu size={18} />
          </button>

          {/* Brand */}
          <Link to="/home" className="font-semibold tracking-tight">
            MVP Leaderboard
          </Link>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-3">
            <OrgSwitcher />
            <AuthMenu />
          </div>
        </div>
      </header>

      {/* Shell: sidebar + content */}
      <div className="grid md:grid-cols-[260px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden md:block bg-white border-r border-gray-200 min-h-[calc(100vh-56px)]">
          <SidebarNav />
        </aside>

        {/* Main content */}
        <main className="min-h-[calc(100vh-56px)] p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white border-r border-gray-200 shadow-xl">
            <div className="h-14 px-3 border-b border-gray-200 flex items-center justify-between">
              <span className="font-medium">Menu</span>
              <button
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 w-9 h-9 hover:bg-gray-50"
                aria-label="Close navigation"
                onClick={() => setOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div
              // Close drawer when any link inside is clicked
              onClick={(e) => {
                const el = e.target as HTMLElement;
                if (el.closest("a")) setOpen(false);
              }}
              className="px-2 py-3"
            >
              <SidebarNav />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
