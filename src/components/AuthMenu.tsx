// src/components/AuthMenu.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type UserInfo = { email?: string; name?: string; avatar_url?: string };

export default function AuthMenu() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const envOk = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

  useEffect(() => {
    if (!envOk) return;

    let unsub = () => {};
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user ? extractUser(data.user) : null);

      const sub = supabase.auth.onAuthStateChange((_e, session) => {
        setUser(session?.user ? extractUser(session.user) : null);
      });
      unsub = () => sub.data.subscription.unsubscribe();
    })();

    return () => unsub();
  }, [envOk]);

  if (!envOk) {
    return <span className="text-xs text-gray-500">Auth not configured</span>;
  }

  async function signOut() {
    await supabase.auth.signOut();
    // Optionally: window.location.assign("/");
  }

  if (!user) {
    return (
      <a
        href="/auth"
        className="px-3 py-1.5 rounded bg-black text-white text-sm"
      >
        Sign in
      </a>
    );
  }

  const initials =
    user.name?.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase() ||
    user.email?.[0]?.toUpperCase() ||
    "?";

  return (
    <div className="flex items-center gap-2">
      {user.avatar_url ? (
        <img
          src={user.avatar_url}
          alt="avatar"
          className="w-8 h-8 rounded-full border"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-800 text-white grid place-items-center text-xs">
          {initials}
        </div>
      )}
      <span className="text-sm text-gray-700 max-w-[14rem] truncate">{user.name || user.email}</span>
      <button
        onClick={signOut}
        className="px-2.5 py-1 rounded border text-sm hover:bg-gray-50"
        title="Sign out"
      >
        Sign out
      </button>
    </div>
  );
}

function extractUser(u: any): UserInfo {
  const md = u?.user_metadata || {};
  return {
    email: u?.email || md.email,
    name: md.full_name || md.name || md.user_name,
    avatar_url: md.avatar_url,
  };
}
