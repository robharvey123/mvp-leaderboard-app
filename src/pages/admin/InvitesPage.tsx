import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/context/OrgContext";

export default function InvitesPage() {
  const { org } = useOrg();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("org_admin");
  const [token, setToken] = useState<string>();

  async function createInvite() {
    if (!org) return;
    const { data, error } = await supabase
      .from("org_invites")
      .insert({ club_id: org.id, email, role })
      .select("token")
      .maybeSingle();
    if (!error) setToken(data?.token);
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Invites</h1>
      <div className="flex gap-2">
        <input className="border rounded px-3 py-2" placeholder="email@club.com" value={email} onChange={e => setEmail(e.target.value)} />
        <select className="border rounded px-3 py-2" value={role} onChange={e => setRole(e.target.value)}>
          <option>org_admin</option><option>team_manager</option><option>analyst</option><option>player</option><option>viewer_public</option>
        </select>
        <button onClick={createInvite} className="rounded px-3 py-2 bg-black text-white">Create</button>
      </div>
      {token && (
        <div className="text-sm">
          Invite link: <code>{location.origin}/accept?token={token}</code>
        </div>
      )}
    </div>
  );
}
