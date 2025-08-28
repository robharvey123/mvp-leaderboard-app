import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { LogOut, KeyRound, Mail, User2, Loader2 } from "lucide-react";

type SessionInfo = {
  email: string;
  name?: string;
  userId: string;
  lastSignInAt?: string;
};

export default function AccountPage() {
  const [info, setInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [{ data: u }, { data: s }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession(),
      ]);
      if (!alive) return;
      const email = u.user?.email || "unknown@user";
      const name = (u.user?.user_metadata as any)?.name as string | undefined;
      const lastSignInAt = s.session?.user?.last_sign_in_at || undefined;
      setInfo({
        email,
        name,
        userId: u.user?.id || "",
        lastSignInAt,
      });
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function signOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    window.location.assign("/auth/sign-in");
  }

  const initial = (info?.name || info?.email || "?").slice(0, 1).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-black text-white grid place-items-center text-lg">{initial}</div>
        <div>
          <h1 className="text-2xl font-bold">Your account</h1>
          <p className="text-sm text-gray-500">Manage your profile and session.</p>
        </div>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        {loading ? (
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="animate-spin" size={18} /> Loading…
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field icon={<User2 size={16} />} label="Name" value={info?.name || "—"} />
            <Field icon={<Mail size={16} />} label="Email" value={info?.email || "—"} />
            <Field label="User ID" value={info?.userId || "—"} mono />
            <Field label="Last sign-in" value={info?.lastSignInAt ? new Date(info.lastSignInAt).toLocaleString() : "—"} />
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="font-semibold mb-3">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/auth/update-password"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 hover:bg-gray-50"
          >
            <KeyRound size={16} /> Update password
          </Link>
          <button
            onClick={signOut}
            disabled={signingOut}
            className="inline-flex items-center gap-2 rounded-xl bg-[rgb(var(--brand-600))] hover:bg-[rgb(var(--brand-700))] text-white px-3 py-2 disabled:opacity-60"
          >
            {signingOut ? <Loader2 className="animate-spin" size={16} /> : <LogOut size={16} />}
            Sign out
          </button>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  icon,
  mono,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-3">
      <div className="text-xs text-gray-500 mb-1 inline-flex items-center gap-1">
        {icon} {label}
      </div>
      <div className={mono ? "font-mono text-sm break-all" : "text-sm"}>{value}</div>
    </div>
  );
}
