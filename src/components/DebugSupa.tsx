import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function DebugSupa({ slug = "brookweald" }: { slug?: string }) {
  const [out, setOut] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("clubs")
        .select("id,slug,name,brand")
        .eq("slug", slug)
        .maybeSingle();
      setOut({ url: import.meta.env.VITE_SUPABASE_URL, ok: !error, data, error });
    })();
  }, [slug]);

  return (
    <pre className="p-3 text-xs bg-neutral-100 rounded border overflow-auto">
      {JSON.stringify(out, null, 2)}
    </pre>
  );
}
