import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Row = {
  match_id: string;
  imported_at: string;
  match_date: string | null;
  opponent: string | null;
  source_bucket: string | null;
  source_path: string | null;
  our_runs: number | null;
  our_wickets: number | null;
  our_overs: number | null;
  opp_runs: number | null;
  opp_wickets: number | null;
  opp_overs: number | null;
};

export default function RecentImports() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const openPdf = async (bucket: string, path: string) => {
    try {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60);
      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch (e: any) {
      alert(`Could not open PDF: ${e?.message || e}`);
    }
  };

  useEffect(() => {
    (async () => {
      setBusy(true);
      setErr(null);
      try {
        const { data, error } = await supabase
          .from("v_match_imports_summary")
          .select("*")
          .order("imported_at", { ascending: false })
          .limit(20);
        if (error) throw error;
        setRows((data ?? []) as Row[]);
      } catch (e: any) {
        setErr(e?.message || String(e));
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Recent Imports</h1>
      {busy && <div>Loading…</div>}
      {err && <div className="text-red-700">Error: {err}</div>}
      {!busy && !err && (
        <div className="overflow-auto rounded border">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="text-left p-2">Imported</th>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Opponent</th>
                <th className="text-left p-2">Totals (Us)</th>
                <th className="text-left p-2">Totals (Opp)</th>
                <th className="text-left p-2">PDF</th>
                <th className="text-left p-2">Match ID</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.match_id} className="border-t">
                  <td className="p-2">{new Date(r.imported_at).toLocaleString()}</td>
                  <td className="p-2">{r.match_date ?? "—"}</td>
                  <td className="p-2">{r.opponent ?? "—"}</td>
                  <td className="p-2">
                    {r.our_runs != null && r.our_wickets != null && r.our_overs != null
                      ? `${r.our_runs}/${r.our_wickets} (${r.our_overs})`
                      : "—"}
                  </td>
                  <td className="p-2">
                    {r.opp_runs != null && r.opp_wickets != null && r.opp_overs != null
                      ? `${r.opp_runs}/${r.opp_wickets} (${r.opp_overs})`
                      : "—"}
                  </td>
                  <td className="p-2">
                    {r.source_bucket && r.source_path ? (
                      <button
                        onClick={() => openPdf(r.source_bucket!, r.source_path!)}
                        className="px-2 py-1 rounded bg-slate-700 text-white"
                      >
                        View PDF
                      </button>
                    ) : "—"}
                  </td>
                  <td className="p-2 font-mono text-xs">{r.match_id}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td className="p-2" colSpan={7}>No imports yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
