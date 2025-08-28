import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useClubTheme(clubId?: string) {
  const [theme, setTheme] = useState<{ primary?: string; secondary?: string; logo_url?: string }>({});

  useEffect(() => {
    if (!clubId) return;
    supabase
      .from("clubs")
      .select("brand")
      .eq("id", clubId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.brand) setTheme(data.brand);
      });
  }, [clubId]);

  return theme;
}
