import { useState } from "react";
import { useAuth } from "@/context/auth-context";

export default function AuthPanel() {
  const { signInWithEmail, signInWithPassword, signUpWithPassword } = useAuth();
  const [tab, setTab] = useState<"magic" | "password">("password"); // default to password (no SMTP needed)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onMagic(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const res = await signInWithEmail(email.trim());
    setMsg(res.message ?? (res.ok ? "Check your email." : "Failed to send link."));
    setBusy(false);
  }
  async function onPasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const res = await signInWithPassword(email.trim(), password);
    setMsg(res.message ?? (res.ok ? "Signed in." : "Sign in failed."));
    setBusy(false);
  }
  async function onPasswordSignUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const res = await signUpWithPassword(email.trim(), password);
    setMsg(res.message ?? (res.ok ? "Account created." : "Sign up failed."));
    setBusy(false);
  }

  return (
    <div className="p-6 rounded-2xl bg-white shadow dark:bg-neutral-900 max-w-md">
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("password")}
          className={`px-3 py-1 rounded ${tab==="password"?"bg-black text-white":"bg-neutral-200 dark:bg-neutral-800"}`}>
          Password
        </button>
        <button onClick={() => setTab("magic")}
          className={`px-3 py-1 rounded ${tab==="magic"?"bg-black text-white":"bg-neutral-200 dark:bg-neutral-800"}`}>
          Magic link
        </button>
      </div>

      {tab === "password" ? (
        <form onSubmit={onPasswordSignIn} className="space-y-3">
          <input type="email" required placeholder="you@example.com"
                 value={email} onChange={(e)=>setEmail(e.target.value)}
                 className="w-full border rounded px-3 py-2 bg-transparent"/>
          <input type="password" required placeholder="password"
                 value={password} onChange={(e)=>setPassword(e.target.value)}
                 className="w-full border rounded px-3 py-2 bg-transparent"/>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50">
              {busy ? "Signing in…" : "Sign in"}
            </button>
            <button type="button" disabled={busy} onClick={onPasswordSignUp}
              className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800">
              {busy ? "…" : "Sign up"}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={onMagic} className="space-y-3">
          <input type="email" required placeholder="you@example.com"
                 value={email} onChange={(e)=>setEmail(e.target.value)}
                 className="w-full border rounded px-3 py-2 bg-transparent"/>
          <button type="submit" disabled={busy} className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50">
            {busy ? "Sending…" : "Email me a magic link"}
          </button>
        </form>
      )}
      {msg && <div className="text-sm mt-3 opacity-80">{msg}</div>}
    </div>
  );
}
