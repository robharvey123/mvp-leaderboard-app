import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { LogOut, User2, LogIn } from "lucide-react";

export default function AuthMenu() {
  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (mounted) setUser(data.user);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      supabase.auth.getUser().then(({ data }) => setUser(data.user));
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setOpen(false);
    nav("/auth/sign-in");
  }

  if (!user) {
    return (
      <Link
        to="/auth/sign-in"
        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 border border-gray-200 hover:bg-gray-50"
      >
        <LogIn size={16} />
        <span>Sign in</span>
      </Link>
    );
  }

  const name =
    user?.user_metadata?.name ||
    (user?.email ? user.email.split("@")[0] : "Account");
  const initial = String(name || "U").slice(0, 1).toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full px-3 py-2 border border-gray-200 bg-white hover:bg-gray-50"
      >
        <div className="w-7 h-7 rounded-full bg-black text-white grid place-items-center text-sm">{initial}</div>
        <span className="hidden sm:block text-sm">{name}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          <Link to="/account" className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50" onClick={() => setOpen(false)}>
            <User2 size={16} /> Account
          </Link>
          <button onClick={signOut} className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-gray-50">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
