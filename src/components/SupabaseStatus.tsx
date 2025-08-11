import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
export default function SupabaseStatus() {
  const [msg, setMsg] = useState("Checking…");
  useEffect(() => { (async () => {
    const { error } = await supabase.from("ping").select("id").limit(1);
    setMsg(error ? `Error: ${error.message}` : "Connected ✓");
  })(); }, []);
  return <div className="p-3 border rounded-xl">{msg}</div>;
}
