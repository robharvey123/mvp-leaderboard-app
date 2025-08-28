import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null); setErr(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/auth/update-password",
    });
    if (error) setErr(error.message);
    else setMsg("Check your email for a reset link.");
  }

  return (
    <div className="min-h-[60vh] grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow">
        <h1 className="text-2xl font-bold mb-2">Reset password</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="email" required placeholder="you@club.com"
            className="w-full rounded-xl border border-gray-300 px-3 py-2"
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
          <button className="w-full rounded-xl bg-black text-white py-2">Send reset link</button>
        </form>
        {msg && <p className="text-sm text-emerald-700 mt-3">{msg}</p>}
        {err && <p className="text-sm text-red-700 mt-3">{err}</p>}
      </div>
    </div>
  );
}
