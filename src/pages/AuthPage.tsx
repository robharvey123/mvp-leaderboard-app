import AuthPanel from "@/components/AuthPanel";
import { useAuth } from "@/context/auth-context";
import { NavLink } from "react-router-dom";

export default function AuthPage() {
  const { user } = useAuth();

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Sign in</h1>

      {user ? (
        <div className="p-4 rounded-2xl bg-white shadow dark:bg-neutral-900">
          <p className="mb-3">You’re signed in as <span className="font-mono">{user.email}</span>.</p>
          <NavLink to="/admin/import" className="px-4 py-2 rounded-xl bg-black text-white">
            Go to Admin • Import
          </NavLink>
        </div>
      ) : (
        <AuthPanel />
      )}

      <div className="text-xs opacity-60">
        Tip: In dev you can enable email+password in Supabase Auth and sign up instantly.
      </div>
    </div>
  );
}
