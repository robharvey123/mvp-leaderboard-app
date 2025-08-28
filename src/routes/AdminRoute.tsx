// src/routes/AdminRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuthOptional } from "@/context/auth-context";

/** Simple admin gate: if no user, send to /login */
export default function AdminRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuthOptional();
  const loc = useLocation();

  if (loading) return <div className="p-6">Checking permissions…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;

  return children;
}
