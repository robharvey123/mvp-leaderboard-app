import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const BUCKET = "imports";   // ensure this bucket exists
const FOLDER = "manual";    // uploads go to imports/manual/...

type Mode = "archive-only" | "write-minimal" | "parse-and-write";

const isUuid = (s?: string | null) =>
  !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s.trim());

export default function ImportPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string>("");
  const [lastPath, setLastPath] = useState<string>("");

  // IDs can come from env for now (you can swap to context later)
  const clubId = (import.meta.env.VITE_CLUB_ID || "").trim();
  const teamId = (import.meta.env.VITE_TEAM_ID || "").trim();
  const seasonId = (import.meta.env.VITE_SEASON_ID || "").trim();
  const hasValidIds = isUuid(clubId) && isUuid(teamId) && isUuid(seasonId);

  const parsed = useMemo(() => {
    try {
      return log ? JSON.parse(log) : null;
    } catch {
      return null;
    }
  }, [log]);

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f && f.type && f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) {
      alert("Please choose a PDF file.");
      return;
    }
    setFile(f);
    setLog("");
    setLastPath("");
  };

  const uploadToStorage = async () => {
    if (!file) throw new Error("No file selected");
    const path = `${FOLDER}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: "application/pdf",
    });
    if (error) throw error;
    console.log("[upload] bucket:", BUCKET, "path:", path);
    setLastPath(path);
    return path; // storage path within BUCKET
  };

  const invoke = async (mode: Mode) => {
    setBusy(true);
    setLog("");
    try {
      const storagePath = await uploadToStorage();
      const { data } = await supabase.functions.invoke("ingest-scorecard", {
        body: {
          mode,
          clubId: clubId || null,
          teamId: teamId || null,
          seasonId: seasonId || null,
          bucket: BUCKET,
          path: storagePath,
        },
      });
      setLog(JSON.stringify(data, null, 2));
    } catch (e: any) {
      try {
        const details = await e?.context?.json?.();
        setLog(JSON.stringify({ error: e.message, details }, null, 2));
      } catch {
        setLog(JSON.stringify({ error: String(e?.message || e) }, null, 2));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Import Play-Cricket PDF</h1>

      {/* Current org context (from env for now) */}
      <div className="text-sm text-slate-600 space-x-2">
        <span>Club: <code>{clubId || "—"}</code></span>
        <span>Team: <code>{teamId || "—"}</code></span>
        <span>Season: <code>{seasonId || "—"}</code></span>
        {!hasValidIds && (
          <span className="ml-2 text-amber-700">
            (Set valid UUIDs in <code>.env.local</code> for Create/Parse)
          </span>
        )}
      </div>

      <input type="file" accept="application/pdf" onChange={onSelect} />

      <div className="flex flex-wrap gap-2">
        <button
          disabled={!file || busy}
          onClick={() => invoke("archive-only")}
          className="px-3 py-2 rounded bg-slate-700 text-white disabled:opacity-50"
        >
          {busy ? "Working…" : "Upload & Ping"}
        </button>

        <button
          disabled={!file || busy || !hasValidIds}
          title={hasValidIds ? "" : "Set VITE_CLUB_ID / VITE_TEAM_ID / VITE_SEASON_ID"}
          onClick={() => invoke("write-minimal")}
          className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
        >
          {busy ? "Working…" : "Upload & Create Match"}
        </button>

        <button
          disabled={!file || busy || !hasValidIds}
          title={hasValidIds ? "" : "Set VITE_CLUB_ID / VITE_TEAM_ID / VITE_SEASON_ID"}
          onClick={() => invoke("parse-and-write")}
          className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
        >
          {busy ? "Working…" : "Upload & Parse + Write"}
        </button>
      </div>

      {/* Result summary card */}
      {parsed && (
        <div className={`p-3 rounded ${parsed.ok ? "bg-green-100 text-green-900" : "bg-amber-100 text-amber-900"}`}>
          <div className="font-medium">
            {parsed.ok ? "Success" : "Problem"} {parsed.mode ? `(${parsed.mode})` : null}
          </div>
          {parsed.traceId && <div>Trace: <code>{parsed.traceId}</code></div>}
          {parsed.source && parsed.source.bucket && parsed.source.path && (
            <div>Source: <code>{parsed.source.bucket}/{parsed.source.path}</code></div>
          )}
          {lastPath && !parsed.source && (
            <div>Last upload: <code>{BUCKET}/{lastPath}</code></div>
          )}
          {parsed.playCricketId && <div>Play-Cricket ID: <code>{parsed.playCricketId}</code></div>}
          {parsed.matchId && <div>Match: <code>{parsed.matchId}</code></div>}

          {/* Parsed basics */}
          {parsed.parsedSummary && (
            <div className="mt-2 text-sm">
              {parsed.parsedSummary.match?.match_date && (
                <div>Date: <code>{parsed.parsedSummary.match.match_date}</code></div>
              )}
              {parsed.parsedSummary.teams?.teamA && parsed.parsedSummary.teams?.teamB && (
                <div>Teams: <code>{parsed.parsedSummary.teams.teamA}</code> v <code>{parsed.parsedSummary.teams.teamB}</code></div>
              )}
              {parsed.parsedSummary.totals && (
                <div>
                  Totals:&nbsp;
                  <code>
                    A: {parsed.parsedSummary.totals.teamA
                      ? `${parsed.parsedSummary.totals.teamA.runs}/${parsed.parsedSummary.totals.teamA.wickets} (${parsed.parsedSummary.totals.teamA.overs})`
                      : "—"}
                  </code>
                  {"  "}
                  <code>
                    B: {parsed.parsedSummary.totals.teamB
                      ? `${parsed.parsedSummary.totals.teamB.runs}/${parsed.parsedSummary.totals.teamB.wickets} (${parsed.parsedSummary.totals.teamB.overs})`
                      : "—"}
                  </code>
                </div>
              )}
              {parsed.parseError && (
                <div className="mt-1 text-amber-900">Parser note: {parsed.parseError}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Raw JSON log */}
      <pre className="text-xs bg-black/5 p-3 rounded overflow-auto max-h-96">
        {log || "Logs will appear here…"}
      </pre>
    </div>
  );
}
