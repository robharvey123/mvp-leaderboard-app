// src/pages/auth/AcceptInvitePage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

export default function AcceptInvitePage() {
  const [sp] = useSearchParams();
  const nav = useNavigate();

  const token = useMemo(
    () => sp.get("token") || sp.get("iv") || sp.get("invite") || "",
    [sp]
  );
  const orgId = sp.get("org") || undefined;

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    token ? "loading" : "idle"
  );
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function run() {
      if (!token) return;
      setStatus("loading");
      setMessage(null);
      try {
        // Prefer Edge Function
        const { data, error } = await supabase.functions.invoke("accept-invite", {
          body: { token, orgId },
        });
        if (!alive) return;
        if (!error && data && (data.ok || data.accepted)) {
          setStatus("success");
          setMessage("Invite accepted. You’ve been added to your club.");
          setTimeout(() => nav("/home"), 1200);
          return;
        }
        // Fallback: Postgres RPC
        const { data: rpcData, error: rpcError } = await supabase.rpc("accept_invite", { token });
        if (!alive) return;
        if (!rpcError && rpcData && (rpcData.ok || rpcData.accepted)) {
          setStatus("success");
          setMessage("Invite accepted. You’ve been added to your club.");
          setTimeout(() => nav("/home"), 1200);
          return;
        }
        setStatus("error");
        setMessage(error?.message || rpcError?.message || "Could not accept invite. The link may be invalid or expired.");
      } catch (e: any) {
        if (!alive) return;
        setStatus("error");
        setMessage(e?.message ?? "Something went wrong while accepting the invite.");
      }
    }
    run();
    return () => { alive = false; };
  }, [token, orgId, nav]);

  if (!token) {
    return (
      <div className="min-h-[60vh] grid place-items-center p-6">
        <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow">
          <h1 className="text-2xl font-bold mb-2">Invitation</h1>
          <p className="text-sm text-gray-600">
            This link is missing an invite token. Please open the invitation email again and click the button inside.
          </p>
          <div className="mt-4">
            <Link to="/" className="rounded-xl border px-3 py-2 hover:bg-gray-50">Back to home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] grid place-items-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow">
        {status === "loading" && (
          <>
            <h1 className="text-2xl font-bold mb-2">Accepting your invite…</h1>
            <p className="text-sm text-gray-600 mb-4">We’re adding you to your club.</p>
            <div className="inline-flex items-center gap-2 text-gray-700">
              <Loader2 className="animate-spin" size={18} /> Working…
            </div>
          </>
        )}
        {status === "success" && (
          <>
            <div className="inline-flex items-center gap-2 text-emerald-700 mb-2">
              <CheckCircle2 size={20} />
              <h1 className="text-2xl font-bold">You’re in!</h1>
            </div>
            <p className="text-sm text-gray-700 mb-4">{message}</p>
            <button
              onClick={() => nav("/home")}
              className="rounded-xl bg-[rgb(var(--brand-600))] hover:bg-[rgb(var(--brand-700))] text-white px-3 py-2"
            >
              Go to dashboard
            </button>
          </>
        )}
        {status === "error" && (
          <>
            <div className="inline-flex items-center gap-2 text-red-700 mb-2">
              <AlertTriangle size={20} />
              <h1 className="text-2xl font-bold">Invite problem</h1>
            </div>
            <p className="text-sm text-gray-700 mb-4">{message || "We couldn’t accept that invite."}</p>
            <div className="flex gap-2">
              <button onClick={() => window.location.reload()} className="rounded-xl border px-3 py-2 hover:bg-gray-50">
                Try again
              </button>
              <Link to="/" className="rounded-xl bg-gray-900 text-white px-3 py-2 hover:bg-black">
                Back home
              </Link>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              If this keeps happening, ask your club admin to send a fresh invite.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
