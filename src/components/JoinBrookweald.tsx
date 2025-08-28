import { supabase } from "../lib/supabaseClient";
import { useOrg } from "../context/OrgContext";

export default function JoinBrookweald() {
  const { setOrg, refreshOrgs } = useOrg();

  async function join() {
    const { error } = await supabase.rpc("join_club_by_slug", { p_slug: "brookweald" });
    if (error) return alert("Join failed: " + error.message);

    // Fetch clubs and select the just-joined one
    const { data } = await supabase.rpc<any[]>("get_my_clubs");
    if (data && data.length > 0) setOrg({ id: data[0].id, name: data[0].name, slug: data[0].slug, brand: data[0].brand });
    else await refreshOrgs();
  }

  return (
    <button
      onClick={join}
      style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: 6, background: "#fff", cursor: "pointer" }}
      title="Attach your account to Brookweald CC"
    >
      Join Brookweald
    </button>
  );
}
