import { useEffect, useState } from "react";
import { useFilters } from "@/context/FilterContext";

type Season = { id: string; name: string };

export default function SeasonPicker() {
  const { seasonId, setSeasonId } = useFilters();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // Try Supabase if present
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (supabaseUrl) {
          const { supabase } = await import("@/lib/supabaseClient");
          const { data, error } = await supabase
            .from("seasons")
            .select("id,name")
            .order("start_date", { ascending: false })
            .limit(12);
          if (error) throw error;
          if (!cancelled) setSeasons((data || []) as Season[]);
        } else {
          // Fallback mock
          if (!cancelled)
            setSeasons([
              { id: "2025", name: "2025 (demo)" },
              { id: "2024", name: "2024 (demo)" },
            ]);
        }
      } catch {
        if (!cancelled)
          setSeasons([
            { id: "2025", name: "2025 (demo)" },
            { id: "2024", name: "2024 (demo)" },
          ]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSeasonId(e.target.value || undefined);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-600">Season</label>
      <select
        value={seasonId || ""}
        onChange={onChange}
        className="border rounded px-2 py-1 text-sm"
        disabled={loading || seasons.length === 0}
      >
        <option value="">All</option>
        {seasons.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
