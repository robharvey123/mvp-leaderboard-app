// src/components/SidebarNav.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import { NAV, type NavItem } from "@/config/nav";
import { cn } from "@/lib/cn";

type Section = Extract<NavItem, { type: "section" }>;

export default function SidebarNav() {
  return (
    <nav className="px-3 py-4 space-y-6">
      {(NAV as Section[]).map((group, gi) => (
        <div key={gi}>
          <div className="px-2 text-xs font-semibold uppercase tracking-wide text-text-soft mb-2">
            {group.label}
          </div>

          <ul className="space-y-1">
            {group.items.map((item, i) => (
              <li key={i}>
                {item.type === "link" ? (
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl transition",
                        isActive
                          ? "bg-[rgb(var(--brand-50))] text-[rgb(var(--brand-800))] border border-[rgb(var(--brand-200))]"
                          : "text-text hover:bg-brand-50/60"
                      )
                    }
                  >
                    {item.icon ? <item.icon size={16} /> : null}
                    <span>{item.label}</span>
                  </NavLink>
                ) : item.type === "ext" ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl transition text-text hover:bg-brand-50/60"
                  >
                    {item.icon ? <item.icon size={16} /> : null}
                    <span>{item.label}</span>
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
