import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SupabaseStatus() {
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [ping, setPing] = useState<"idle" | "ok" | "fail">("idle");
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSessionEmail(data.session?.user?.email ?? null);
    })();
  }, []);

  async function testQuery() {
    try {
      setPing("idle");
      setMsg("Testing select on scoring_configs…");
      const { error, count } = await supabase
        .from("scoring_configs")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      setPing("ok");
      setMsg(`DB reachable. scoring_configs rows: ${count ?? 0}`);
    } catch (e: any) {
      setPing("fail");
      setMsg(e?.message ?? "Query failed");
    }
  }

  async function testAuth() {
    try {
      setMsg("Fetching current user…");
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      setMsg(`User: ${data.user?.email ?? "none"}`);
    } catch (e: any) {
      setMsg(e?.message ?? "Auth check failed");
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Supabase Status</h1>
      <div className="text-sm text-neutral-600">
        Session: {sessionEmail ? sessionEmail : "not signed in"}
      </div>
      <div className="flex gap-2">
        <button onClick={testQuery} className="px-3 py-2 rounded bg-black text-white">Test DB</button>
        <button onClick={testAuth} className="px-3 py-2 rounded border">Test Auth</button>
      </div>
      <div
        className={`text-sm ${
          ping === "ok" ? "text-green-700" : ping === "fail" ? "text-red-700" : "text-neutral-600"
        }`}
      >
        {msg}
      </div>
    </div>
  );
}
