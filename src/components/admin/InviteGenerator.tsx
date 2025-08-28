import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/context/OrgContext";
import { Loader2, Check, Copy, Mail } from "lucide-react";

export default function InviteGenerator() {
  const { clubId } = useOrg() as any;
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "org_admin" | "org_owner">("member");
  const [link, setLink] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setErr(null); setLink(null); setCopied(false);
    if (!clubId) { setErr("No club selected."); return; }
    setLoading(true);
    try {
      // 1) Edge Function (recommended)
      const { data, error } = await supabase.functions.invoke("create-invite", {
        body: { email, role, orgId: clubId },
      });
      if (!error && data?.token) {
        const url = `${window.location.origin}/accept?token=${encodeURIComponent(data.token)}&org=${encodeURIComponent(clubId)}`;
        setLink(url);
        setLoading(false);
        return;
      }
      // 2) Fallback: RPC
      const { data: rpc, error: rpcErr } = await supabase.rpc("create_invite", {
        email,
        role,
        org_id: clubId,
      });
      if (rpcErr) throw rpcErr;
      if (rpc?.token) {
        const url = `${window.location.origin}/accept?token=${encodeURIComponent(rpc.token)}&org=${encodeURIComponent(clubId)}`;
        setLink(url);
      } else {
        setErr("Invite created but no token was returned.");
      }
    } catch (e: any) {
      setErr(e?.message ?? "Could not create invite.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="font-semibold mb-3">Invite a member</h3>
      <div className="grid sm:grid-cols-[1fr_auto] gap-3">
        <label className="text-sm">
          <div className="text-gray-600 mb-1">Email</div>
          <input
            type="email" placeholder="teammate@club.com"
            className="w-full rounded-xl border border-gray-300 px-3 py-2"
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <div className="text-gray-600 mb-1">Role</div>
          <select
            className="w-full rounded-xl border border-gray-300 px-3 py-2"
            value={role} onChange={(e) => setRole(e.target.value as any)}
          >
            <option value="member">Member</option>
            <option value="org_admin">Admin</option>
            <option value="org_owner">Owner</option>
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={generate}
          disabled={loading || !email}
          className="inline-flex items-center gap-2 rounded-xl bg-[rgb(var(--brand-600))] hover:bg-[rgb(var(--brand-700))] text-white px-3 py-2 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
          Generate invite
        </button>

        {link && (
          <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <span className="text-xs sm:text-sm max-w-[36ch] truncate">{link}</span>
            <button onClick={copy} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 hover:bg-white">
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </div>

      {err && <p className="mt-2 text-sm text-red-700">{err}</p>}
      {!err && clubId && <p className="mt-2 text-xs text-gray-500">Invites will add users to this club (ID: {clubId}).</p>}
    </section>
  );
}
