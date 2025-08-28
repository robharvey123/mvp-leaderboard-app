// src/pages/admin/ImportPage.tsx
import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // used for env checks only (client existence)
import { fmtShort } from "@/components/charts/formatters"; // optional; safe if present

type ParsedMatch = any; // using loose types so this works regardless of your parser's exact shape

// local CSV helper (works even if src/lib/export/toCsv.ts isn't wired)
function downloadCsv(filename: string, rows: (string | number)[][], delimiter = ",") {
  const csv =
    rows
      .map((r) =>
        r
          .map((cell) => {
            const s = String(cell ?? "");
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(delimiter)
      )
      .join("\n") + "\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const card = "p-4 rounded-2xl shadow bg-white";
const h2c = "font-semibold mb-2";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [parsed, setParsed] = useState<ParsedMatch | null>(null);
  const [ourSide, setOurSide] = useState<"home" | "away" | "">("");
  const [saved, setSaved] = useState<{ ok: boolean; matchId?: string } | null>(null);

  const envOk = useMemo(() => {
    // Soft env check; don't block parsing
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const club = import.meta.env.VITE_CLUB_ID;
    return Boolean(url && key && club);
  }, []);

  async function handleParse() {
    if (!file) return;
    setBusy(true);
    setStatus("Parsing PDF…");
    try {
      const [{ parsePlayCricketPdf }] = await Promise.all([import("@/import/pcPdf")]);
      // Feed either File directly or an ArrayBuffer, depending on your parser
      let result: any;
      try {
        result = await parsePlayCricketPdf(file as any);
      } catch {
        const buf = await file.arrayBuffer();
        result = await parsePlayCricketPdf(buf as any);
      }
      setParsed(result);
      setStatus("Parsed. Review preview below.");
      // Try to guess "our side" by name match to club brand/name if present
      setOurSide("");
      setSaved(null);
    } catch (e: any) {
      console.error(e);
      setStatus("Parse failed: " + (e?.message || "Unknown error"));
      setParsed(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    if (!parsed) return;
    setBusy(true);
    setStatus("Saving to database…");
    try {
      const [{ ingestParsedToDb }] = await Promise.all([import("@/import/ingestParsed")]);
      const res: any = await ingestParsedToDb(parsed);
      // Best-effort detect matchId shape
      const matchId =
        res?.matchId || res?.id || res?.[0]?.matchId || res?.[0]?.id || res?.data?.match_id;
      setSaved({ ok: true, matchId });
      setStatus("Saved to DB. You can download CSVs below.");
    } catch (e: any) {
      console.error(e);
      setSaved({ ok: false });
      setStatus("Save failed: " + (e?.message || "Unknown error"));
    } finally {
      setBusy(false);
    }
  }

  function teamBlock(which: "home" | "away") {
    if (!parsed) return { name: "", batting: [], bowling: [], fielding: [] } as any;
    const side = parsed[which] ?? {};
    return {
      name: side.team || side.name || parsed?.meta?.[which] || which.toUpperCase(),
      batting: side.batting ?? [],
      bowling: side.bowling ?? [],
      fielding: side.fielding ?? [],
    };
  }

  function rowsFromBatting(batting: any[]) {
    return batting.map((b: any) => ({
      player: b.name ?? b.player ?? "",
      runs: Number(b.runs ?? 0),
      balls: Number(b.balls ?? 0),
      fours: Number(b.fours ?? 0),
      sixes: Number(b.sixes ?? 0),
      dismissal: b.dismissal ?? b.how_out ?? "",
    }));
  }
  function rowsFromBowling(bowling: any[]) {
    return bowling.map((b: any) => ({
      player: b.name ?? b.player ?? "",
      overs: Number(b.overs ?? b.o ?? 0),
      maidens: Number(b.maidens ?? b.m ?? 0),
      runs: Number(b.runs ?? b.r ?? 0),
      wickets: Number(b.wickets ?? b.w ?? 0),
    }));
  }
  function rowsFromFielding(fielding: any[]) {
    return fielding.map((f: any) => ({
      player: f.name ?? f.player ?? "",
      catches: Number(f.catches ?? f.ct ?? 0),
      stumpings: Number(f.stumpings ?? f.st ?? 0),
      runouts: Number(f.runouts ?? f.ro ?? 0),
      drops: Number(f.drops ?? 0),
      misfields: Number(f.misfields ?? 0),
    }));
  }

  async function downloadPointsCsv() {
    if (!parsed || !ourSide) return;
    // Pull active formula (or default) from engine
    const [{ DEFAULT_FORMULA, calcBattingPoints, calcBowlingPoints, calcFieldingPoints }] =
      await Promise.all([import("@/lib/scoring/engine")]);
    let formula = DEFAULT_FORMULA;
    try {
      const { getActiveFormula } = await import("@/lib/scoring/recompute");
      const f = await getActiveFormula?.();
      if (f) formula = f as any;
    } catch {
      /* fall back to DEFAULT_FORMULA */
    }

    const side = teamBlock(ourSide);
    const batting = rowsFromBatting(side.batting);
    const bowling = rowsFromBowling(side.bowling);
    const fielding = rowsFromFielding(side.fielding);

    // Index stats per player
    const byPlayer = new Map<
      string,
      {
        player: string;
        runs: number;
        fours: number;
        sixes: number;
        balls: number;
        wickets: number;
        maidens: number;
        catches: number;
        stumpings: number;
        runouts: number;
        pointsBat: number;
        pointsBowl: number;
        pointsField: number;
      }
    >();

    function ensure(name: string) {
      if (!byPlayer.has(name)) {
        byPlayer.set(name, {
          player: name,
          runs: 0,
          fours: 0,
          sixes: 0,
          balls: 0,
          wickets: 0,
          maidens: 0,
          catches: 0,
          stumpings: 0,
          runouts: 0,
          pointsBat: 0,
          pointsBowl: 0,
          pointsField: 0,
        });
      }
      return byPlayer.get(name)!;
    }

    batting.forEach((b) => {
      const r = ensure(b.player);
      r.runs = b.runs;
      r.fours = b.fours;
      r.sixes = b.sixes;
      r.balls = b.balls;
      r.pointsBat = calcBattingPoints(formula.batting, {
        runs: b.runs,
        balls: b.balls,
        fours: b.fours,
        sixes: b.sixes,
        dismissal: (b as any).dismissal,
      });
    });

    bowling.forEach((b) => {
      const r = ensure(b.player);
      r.wickets = b.wickets;
      r.maidens = b.maidens;
      r.pointsBowl = calcBowlingPoints(formula.bowling, {
        overs: b.overs,
        maidens: b.maidens,
        runs: b.runs,
        wickets: b.wickets,
      });
    });

    fielding.forEach((f) => {
      const r = ensure(f.player);
      r.catches = f.catches;
      r.stumpings = f.stumpings;
      r.runouts = f.runouts;
      r.pointsField = calcFieldingPoints(formula.fielding, {
        catches: f.catches,
        stumpings: f.stumpings,
        runouts: f.runouts,
        drops: (f as any).drops ?? 0,
        misfields: (f as any).misfields ?? 0,
      } as any);
    });

    // CSV rows — per your standard reporting fields
    const header = [
      "Player",
      "Match",
      "Runs",
      "4s",
      "6s",
      "50 Scored",
      "100 Scored",
      "Wickets",
      "Maidens",
      "5 Wickets",
      "Catches",
      "Stumpings",
      "Run-Outs",
      "Batting Points",
      "Bowling Points",
      "Fielding Points",
      "Total Points",
    ];

    const matchLabel =
      parsed?.meta?.date ||
      parsed?.meta?.match_date ||
      parsed?.meta?.title ||
      `${teamBlock("home").name} vs ${teamBlock("away").name}`;

    const rows: (string | number)[][] = [header];
    for (const r of Array.from(byPlayer.values())) {
      const f50 = r.runs >= 50 && r.runs < 100 ? 1 : 0;
      const f100 = r.runs >= 100 ? 1 : 0;
      const f5w = r.wickets >= 5 ? 1 : 0;
      const total = r.pointsBat + r.pointsBowl + r.pointsField;
      rows.push([
        r.player,
        matchLabel,
        r.runs,
        r.fours,
        r.sixes,
        f50,
        f100,
        r.wickets,
        r.maidens,
        f5w,
        r.catches,
        r.stumpings,
        r.runouts,
        r.pointsBat,
        r.pointsBowl,
        r.pointsField,
        total,
      ]);
    }

    const fname = `match-points-${matchLabel.replace(/\s+/g, "_")}.csv`;
    downloadCsv(fname, rows);
  }

  async function downloadBowlingCsv() {
    if (!parsed || !ourSide) return;
    const side = teamBlock(ourSide);
    const bowling = rowsFromBowling(side.bowling);
    const matchLabel =
      parsed?.meta?.date ||
      parsed?.meta?.match_date ||
      parsed?.meta?.title ||
      `${teamBlock("home").name} vs ${teamBlock("away").name}`;

    const rows: (string | number)[][] = [["Player", "Overs", "Maidens", "Runs", "Wickets"]];
    bowling.forEach((b) => rows.push([b.player, b.overs, b.maidens, b.runs, b.wickets]));
    const fname = `bowling-${side.name?.replace(/\s+/g, "_")}-${matchLabel.replace(/\s+/g, "_")}.csv`;
    downloadCsv(fname, rows);
  }

  return (
    <div className="p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Import scorecards</h1>
        {!envOk && (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
            Missing <code>VITE_SUPABASE_URL</code>, <code>VITE_SUPABASE_ANON_KEY</code> or{" "}
            <code>VITE_CLUB_ID</code>. Parsing will still work, but saving to DB will fail.
          </div>
        )}
      </header>

      <section className={card}>
        <h2 className={h2c}>1) Upload a Play-Cricket PDF</h2>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button
            className={`px-4 py-2 rounded text-white ${file ? "bg-black" : "bg-gray-400 cursor-not-allowed"}`}
            disabled={!file || busy}
            onClick={handleParse}
          >
            {busy ? "Working…" : "Parse"}
          </button>
        </div>
        {status && <p className="mt-2 text-sm text-gray-600">{status}</p>}
      </section>

      {parsed && (
        <>
          <section className={card}>
            <h2 className={h2c}>2) Preview & choose your side</h2>
            <div className="text-sm text-gray-600 mb-3">
              <div>
                Match:&nbsp;
                <strong>
                  {teamBlock("home").name} vs {teamBlock("away").name}
                </strong>
              </div>
              <div>Date: {parsed?.meta?.date || parsed?.meta?.match_date || "—"}</div>
              <div>Ground: {parsed?.meta?.ground || "—"}</div>
            </div>

            <div className="flex items-center gap-6 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="ourside"
                  value="home"
                  checked={ourSide === "home"}
                  onChange={() => setOurSide("home")}
                />
                Our team is: <strong>{teamBlock("home").name}</strong>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="ourside"
                  value="away"
                  checked={ourSide === "away"}
                  onChange={() => setOurSide("away")}
                />
                Our team is: <strong>{teamBlock("away").name}</strong>
              </label>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">{teamBlock("home").name} — Batting</h3>
                <SimpleTable
                  columns={["Player", "Runs", "Balls", "4s", "6s", "Dismissal"]}
                  rows={rowsFromBatting(teamBlock("home").batting).map((r) => [
                    r.player,
                    r.runs,
                    r.balls,
                    r.fours,
                    r.sixes,
                    r.dismissal,
                  ])}
                />
                <h3 className="font-medium mt-4 mb-2">{teamBlock("home").name} — Bowling</h3>
                <SimpleTable
                  columns={["Player", "O", "M", "R", "W"]}
                  rows={rowsFromBowling(teamBlock("home").bowling).map((r) => [
                    r.player,
                    r.overs,
                    r.maidens,
                    r.runs,
                    r.wickets,
                  ])}
                />
              </div>

              <div>
                <h3 className="font-medium mb-2">{teamBlock("away").name} — Batting</h3>
                <SimpleTable
                  columns={["Player", "Runs", "Balls", "4s", "6s", "Dismissal"]}
                  rows={rowsFromBatting(teamBlock("away").batting).map((r) => [
                    r.player,
                    r.runs,
                    r.balls,
                    r.fours,
                    r.sixes,
                    r.dismissal,
                  ])}
                />
                <h3 className="font-medium mt-4 mb-2">{teamBlock("away").name} — Bowling</h3>
                <SimpleTable
                  columns={["Player", "O", "M", "R", "W"]}
                  rows={rowsFromBowling(teamBlock("away").bowling).map((r) => [
                    r.player,
                    r.overs,
                    r.maidens,
                    r.runs,
                    r.wickets,
                  ])}
                />
              </div>
            </div>
          </section>

          <section className={card}>
            <h2 className={h2c}>3) Save & download</h2>
            <div className="flex flex-wrap items-center gap-3">
              <button
                className={`px-4 py-2 rounded text-white ${parsed ? "bg-black" : "bg-gray-400 cursor-not-allowed"}`}
                onClick={handleSave}
                disabled={!parsed || busy}
              >
                {busy ? "Working…" : "Save to DB"}
              </button>

              <span className="text-sm text-gray-500">
                {saved?.ok ? "Saved ✔︎" : saved ? "Save failed" : ""}
              </span>

              <div className="h-6 w-px bg-gray-300 mx-2" />

              <button
                className={`px-4 py-2 rounded text-white ${
                  parsed && ourSide ? "bg-emerald-600" : "bg-gray-400 cursor-not-allowed"
                }`}
                onClick={downloadPointsCsv}
                disabled={!parsed || !ourSide}
                title="Downloads MVP points for your selected team"
              >
                Download Match MVP (CSV)
              </button>

              <button
                className={`px-4 py-2 rounded text-white ${
                  parsed && ourSide ? "bg-sky-600" : "bg-gray-400 cursor-not-allowed"
                }`}
                onClick={downloadBowlingCsv}
                disabled={!parsed || !ourSide}
                title="Downloads O-M-R-W for your selected team"
              >
                Download Bowling O-M-R-W (CSV)
              </button>
            </div>

            {!ourSide && (
              <p className="text-xs text-gray-500 mt-2">
                Pick which side is your club before downloading.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

/** Tiny presentational table */
function SimpleTable({ columns, rows }: { columns: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto border rounded">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((c) => (
              <th key={c} className="text-left px-3 py-2 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-3 py-2 text-gray-500" colSpan={columns.length}>
                No rows
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="odd:bg-white even:bg-gray-50">
                {r.map((cell, j) => (
                  <td key={j} className="px-3 py-2 whitespace-nowrap">
                    {typeof cell === "number" ? cell : cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
