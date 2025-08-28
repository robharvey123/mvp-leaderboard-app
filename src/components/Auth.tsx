// src/pages/Auth.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Auth() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>();

  async function signInWithGoogle() {
    try {
      setBusy(true); setMsg(undefined);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (e: any) {
      setMsg(e.message || "Failed to start sign-in.");
    } finally {
      setBusy(false);
    }
  }

  // Optional: email magic link if you've configured SMTP in Supabase
  async function sendMagicLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "");
    try {
      setBusy(true); setMsg(undefined);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin }
      });
      if (error) throw error;
      setMsg("Check your email for a sign-in link.");
    } catch (e: any) {
      setMsg(e.message || "Failed to send magic link.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    // If already signed in, bounce home
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.replace("/");
    });
  }, []);

  return (
    <div className="p-6 max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <button
        onClick={signInWithGoogle}
        className={`w-full px-4 py-2 rounded text-white ${busy ? "bg-gray-400" : "bg-black"}`}
        disabled={busy}
      >
        Continue with Google
      </button>

      <div className="text-xs text-gray-500 text-center">— or —</div>

      <form onSubmit={sendMagicLink} className="space-y-2">
        <input
          type="email"
          name="email"
          placeholder="you@example.com"
          className="border rounded px-3 py-2 w-full"
          required
        />
        <button
          className={`w-full px-4 py-2 rounded text-white ${busy ? "bg-gray-400" : "bg-gray-800"}`}
          disabled={busy}
        >
          Send magic link
        </button>
      </form>

      {msg && <p className="text-sm text-gray-700">{msg}</p>}
    </div>
  );
}
