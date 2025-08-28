// src/pages/auth/SignUpPage.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

export default function SignUpPage() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setMsg("Check your inbox to confirm your email. You can sign in once confirmed.");
    // Optionally redirect after a few seconds
    setTimeout(() => nav("/auth/sign-in"), 2000);
  }

  return (
    <div className="min-h-[60vh] grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow">
        <h1 className="text-2xl font-bold mb-2">Create your account</h1>
        <p className="text-sm text-gray-500 mb-4">Join your club and get going.</p>

        {err && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
            {err}
          </div>
        )}
        {msg && (
          <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 px-3 py-2 text-sm">
            {msg}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm">
            <span className="text-gray-600">Name</span>
            <input
              type="text"
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Batter"
            />
          </label>

          <label className="block text-sm">
            <span className="text-gray-600">Email</span>
            <input
              type="email"
              required
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          <label className="block text-sm">
            <span className="text-gray-600">Password</span>
            <input
              type="password"
              required
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[rgb(var(--brand-600))] hover:bg-[rgb(var(--brand-700))] text-white py-2 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Sign up
          </button>
        </form>

        <div className="mt-4 text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/auth/sign-in" className="text-[rgb(var(--brand-700))] hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
