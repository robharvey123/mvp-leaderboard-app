// src/hooks/useSeasonBounds.ts
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type SeasonBounds = {
  start?: string; // ISO "YYYY-MM-DD"
  end?: string;   // ISO "YYYY-MM-DD"
  loading: boolean;
  error?: string;
};

/** Reads seasons.id → returns { start, end } (ISO). */
export default function useSeasonBounds(seasonId?: string): SeasonBounds {
  const [state, setState] = useState<SeasonBounds>({ loading: !!seasonId });

  useEffect(() => {
    let cancelled = false;
    if (!seasonId) return setState({ loading: false });
    (async () => {
      setState(s => ({ ...s, loading: true, error: undefined }));
      const { data, error } = await supabase
        .from("seasons")
        .select("start_date, end_date")
        .eq("id", seasonId)
        .maybeSingle();
      if (cancelled) return;
      if (error) return setState({ loading: false, error: error.message });
      // Ensure plain ISO dates (YYYY-MM-DD)
      const start = data?.start_date ?? undefined;
      const end = data?.end_date ?? undefined;
      setState({ loading: false, start, end });
    })();
    return () => { cancelled = true; };
  }, [seasonId]);

  return useMemo(() => state, [state]);
}
