// src/components/NavBar.tsx
import { Link } from "react-router-dom";
import useContextIds from "@/hooks/useContextIds";
import { useClubTheme } from "@/hooks/useClubTheme";

export default function NavBar() {
  const { clubId } = useContextIds();
  const theme = useClubTheme(clubId);

  return (
    <nav
      className="w-full flex items-center justify-between px-4 py-3 shadow-sm"
      style={{ backgroundColor: theme.primary || "#0f172a" }} // fallback if no theme yet
    >
      <div className="flex items-center gap-2">
        {theme.logo_url && (
          <img
            src={theme.logo_url}
            alt="Club Logo"
            className="h-8 w-8 rounded-full object-cover"
          />
        )}
        <Link to="/" className="text-lg font-bold text-white">
          MVP Leaderboard
        </Link>
      </div>

      <div className="flex gap-4 text-sm text-white">
        <Link to="/leaderboard">Leaderboard</Link>
        <Link to="/analytics/player">Analytics</Link>
        <Link to="/admin/import">Admin</Link>
      </div>
    </nav>
  );
}
