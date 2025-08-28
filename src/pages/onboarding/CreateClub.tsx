// src/pages/onboarding/CreateClub.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

export default function CreateClub() {
  const nav = useNavigate();

  const [sessionReady, setSessionReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [primary, setPrimary] = useState("#0ea5e9");
  const [secondary, setSecondary] = useState("#10b981");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();
  const [ok, setOk] = useState<string>();

  // Resolve auth status
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSignedIn(Boolean(data?.session));
      setSessionReady(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, ses) => {
      setSignedIn(Boolean(ses));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(undefined);
    setOk(undefined);
    try {
      const p_name = name.trim();
      const p_slug = (slug || slugify(name)).trim();
      if (!p_name || !p_slug) throw new Error("Enter a club name (and optional slug).");

      const brand = { primary, secondary };
      const { data, error } = await supabase.rpc("create_club_with_owner", {
        p_name,
        p_slug,
        p_brand: brand,
      });
      if (error) throw error;

      setOk("Club created! Redirecting…");
      // Give OrgContext a moment to see the new membership, then go home.
      setTimeout(() => nav("/"), 600);
    } catch (e: any) {
      setErr(e?.message || "Failed to create club");
    } finally {
      setBusy(false);
    }
  }

  if (!sessionReady) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600">Checking sign-in state…</p>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="p-6 max-w-xl space-y-4">
        <h1 className="text-2xl font-bold">Create your club</h1>
        <p className="text-sm text-gray-600">
          You need to be signed in to create a club. Please sign in, then return here.
        </p>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded bg-black text-white"
            onClick={() => (window.location.href = "/")}
            title="Go to home / your sign-in flow"
          >
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-2">Create your club</h1>
      <p className="text-sm text-gray-600 mb-6">
        This sets up a private space for your teams, players and seasons. You’ll be the owner.
      </p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Club name</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slug) setSlug(slugify(e.target.value));
            }}
            placeholder="Brookweald CC"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Slug</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            placeholder="brookweald"
          />
          <p className="text-xs text-gray-500 mt-1">Used internally to group your data.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Brand primary</label>
            <input
              type="color"
              className="border rounded w-12 h-10 p-0"
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Brand secondary</label>
            <input
              type="color"
              className="border rounded w-12 h-10 p-0"
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
            />
          </div>
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}
        {ok && <p className="text-sm text-emerald-700">{ok}</p>}

        <button
          className={`px-4 py-2 rounded text-white ${busy ? "bg-gray-400" : "bg-black"}`}
          disabled={busy}
        >
          {busy ? "Creating…" : "Create club"}
        </button>
      </form>
    </div>
  );
}
