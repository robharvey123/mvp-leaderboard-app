import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

export default function SignInPage() {
  const [sp] = useSearchParams();
  const redirectTo = sp.get("next") || "/";
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    nav(redirectTo);
  }

  return (
    <div className="min-h-[60vh] grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow">
        <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
        <p className="text-sm text-gray-500 mb-4">Sign in to your club dashboard.</p>

        {err && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{err}</div>}

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm">
            <span className="text-gray-600">Email</span>
            <input
              type="email" required autoComplete="email"
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">Password</span>
            <input
              type="password" required autoComplete="current-password"
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button
            type="submit" disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[rgb(var(--brand-600))] hover:bg-[rgb(var(--brand-700))] text-white py-2 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Sign in
          </button>
        </form>

        <div className="mt-4 text-sm text-gray-600 flex items-center justify-between">
          <Link to="/auth/forgot-password" className="hover:underline">Forgot password?</Link>
          <div>New here? <Link to="/auth/sign-up" className="text-[rgb(var(--brand-700))] hover:underline">Create account</Link></div>
        </div>
      </div>
    </div>
  );
}
