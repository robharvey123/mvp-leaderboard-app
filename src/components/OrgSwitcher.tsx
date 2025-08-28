// src/components/OrgSwitcher.tsx
import { useEffect, useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuthOptional } from "@/context/auth-context";
import { useOrg } from "@/context/OrgContext";

type Club = { id: string; name: string };

export default function OrgSwitcher() {
  const { user } = useAuthOptional();
  const { clubId, setClubId } = useOrg(); // setClubId should exist on your OrgContext
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    loadClubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function loadClubs() {
    setLoading(true);
    setErr(null);
    try {
      if (user) {
        // Try membership-driven fetch first (user_org_roles -> clubs)
        const { data: roles, error: er1 } = await supabase
          .from("user_org_roles")
          .select("club_id")
          .eq("user_id", user.id);

        if (er1) throw er1;

        const ids = Array.from(new Set((roles ?? []).map((r: any) => r.club_id).filter(Boolean)));

        if (ids.length) {
          const { data: cs, error: er2 } = await supabase
            .from("clubs")
            .select("id,name")
            .in("id", ids);

          if (er2) throw er2;
          setClubs((cs ?? []) as Club[]);
        } else {
          // Fallback to RLS-scoped list (may return 0 if RLS is strict)
          const { data: cs2, error: er3 } = await supabase
            .from("clubs")
            .select("id,name")
            .limit(20);
          if (er3) throw er3;
          setClubs((cs2 ?? []) as Club[]);
        }
      } else {
        // Not signed in → provide a harmless placeholder
        setClubs([{ id: "demo", name: "Demo Club" }]);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Could not load clubs.");
      if (!clubs.length) setClubs([{ id: "demo", name: "Demo Club" }]);
    } finally {
      setLoading(false);
    }
  }

  function onSelect(id: string) {
    setClubId?.(id); // optional chaining in case setter isn't present
    localStorage.setItem("mvp:lastClubId", id);
  }

  const current = clubs.find((c) => c.id === clubId) || clubs[0];

  return (
    <div className="relative">
      <label className="sr-only">Organisation</label>
      <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm">
        <select
          className="bg-transparent outline-none"
          value={current?.id ?? ""}
          onChange={(e) => onSelect(e.target.value)}
          disabled={loading}
        >
          {clubs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <ChevronsUpDown size={14} className="text-gray-500" />
      </div>
      {err ? <div className="mt-1 text-xs text-red-600">{err}</div> : null}
    </div>
  );
}
