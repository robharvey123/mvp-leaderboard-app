// src/config/nav.ts
import type { ComponentType } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Settings,
  Settings2,
  Trophy,
  ExternalLink,
  Home,
  Link as LinkIcon, // alias to avoid clash with react-router's Link
} from "lucide-react";

export type IconType = ComponentType<any>;

export type NavItem =
  | { type: "link"; label: string; to: string; icon?: IconType }
  | { type: "ext"; label: string; href: string; icon?: IconType; external: true }
  | { type: "section"; label: string; items: NavItem[] };

export const NAV: NavItem[] = [
  {
    type: "section",
    label: "Home",
    items: [{ type: "link", label: "Home", to: "/home", icon: Home }],
  },
  {
    type: "section",
    label: "Analytics",
    items: [
      { type: "link", label: "Club Overview", to: "/analytics/club", icon: LayoutDashboard },
      { type: "link", label: "Season Dashboard", to: "/analytics/season", icon: Trophy },
      { type: "link", label: "Team Stats", to: "/analytics/team", icon: BarChart3 },
      { type: "link", label: "Player Explorer", to: "/analytics/players", icon: Users },
      { type: "link", label: "Category Breakdown", to: "/analytics/categories", icon: BarChart3 },
    ],
  },
  {
    type: "section",
    label: "Admin",
    items: [
      { type: "link", label: "Club Admin", to: "/admin/club", icon: Settings2 },
      { type: "link", label: "Scoring Engine", to: "/admin/scoring", icon: Settings },
      { type: "link", label: "Import", to: "/admin/import", icon: Settings },
      { type: "link", label: "Play-Cricket Admin", to: "/admin/play-cricket", icon: LinkIcon },
    ],
  },
  {
    type: "section",
    label: "Play-Cricket",
    items: [
      { type: "ext", label: "Club Home", href: "https://play-cricket.com", icon: ExternalLink, external: true },
      { type: "ext", label: "Fixtures & Results", href: "https://play-cricket.com", icon: ExternalLink, external: true },
      { type: "ext", label: "League Tables", href: "https://play-cricket.com", icon: ExternalLink, external: true },
    ],
  },
];
