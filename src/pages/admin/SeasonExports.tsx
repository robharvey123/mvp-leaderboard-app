// src/pages/admin/SeasonExports.tsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/context/OrgContext";

type Season = {
  id: string; name: string;
  start_date?: string | null; end_date?: string | null; is_active?: boolean | null;
};
type Row = Record<string, string | number>;

function downloadCsv(filename: string, rows: Row[], headerOrder?: string[]) {
  if (!rows.length) return;
  const headers = headerOrder?.length ? headerOrder : Array.from(new Set(rows.flatMap(r => Object.keys(r))));
  const csv =
    [headers.join(","), ...rows.map(r => headers.map(h => {
      const v = r[h] ?? ""; const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(","))].join("\n") + "\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/** Candidate columns that could link a card row to a match row */
const LINK_CANDIDATES = [
  "match_id", "matchId", "matchid", "matchID",
  "game_id", "gameId",
  "fixture_id", "fixtureId", "fixture",
  "scorecard_id", "scorecardId",
  "innings_id", "inningsId",
] as const;

/** Probe if a column exists on a table (no data required). */
async function columnExists(table: string, col: string): Promise<boolean> {
  const sel = `${col}`; // single column
  const res = await supabase.from(table).select(sel).limit(1);
  return !res.error; // PostgREST returns 400 if column doesn't exist
}

/** Detect the link key by checking which candidate column actually exists. */
async function detectLinkKey(
  table: "batting_cards" | "bowling_cards" | "fielding_cards"
): Promise<string | null> {
  for (const col of LINK_CANDIDATES) {
    // eslint-disable-next-line no-await-in-loop
    const exists = await columnExists(table, col);
    if (exists) return col;
  }
  return null;
}

/** Safe numeric accessor across variant column names */
const num = (r: any, keys: string[], fallback = 0) => {
  for (const k of keys) {
    if (r[k] !== undefined && r[k] !== null && !Number.isNaN(Number(r[k]))) return Number(r[k]);
  }
  return fallback;
};

export default function SeasonExports() {
  const { org, loading: orgLoading } = useOrg();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonId, setSeasonId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [debug, setDebug] = useState<string>("");
  const [sampleKeys, setSampleKeys] = useState<string>("");

  const activeLabel = useMemo(() => {
    const s = seasons.find(s => s.id === seasonId);
    return s ? `${s.name}` : "";
  }, [seasons, seasonId]);

  useEffect(() => {
    (async () => {
      if (!org || orgLoading) return;
      const { data, error } = await supabase
        .from("seasons")
        .select("id, name, start_date, end_date, is_active")
        .eq("club_id", org.id)
        .order("start_date", { ascending: true });
      if (error) setMsg(error.message || "Failed to load seasons");
      setSeasons(data || []);
      const active = (data || []).find(s => s.is_active) || (data || [])[Math.max(0, (data || []).length - 1)];
      setSeasonId(active?.id || (data?.[0]?.id ?? ""));
    })();
  }, [org, orgLoading]);

  /** Player id -> name */
  async function getPlayersMap(): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    const { data, error } = await supabase.from("players").select("id, name").eq("club_id", org!.id);
    if (error) throw error;
    for (const p of data || []) map.set(String(p.id), p.name || String(p.id));
    return map;
  }

  /** Get match IDs for this season (prefer matches.season_id; otherwise date columns) */
  async function getSeasonMatchIds(): Promise<{ matchIds: string[]; method: string }> {
    const { data: seasonRow, error: eSeason } = await supabase
      .from("seasons")
      .select("start_date, end_date")
      .eq("id", seasonId)
      .limit(1)
      .single();
    if (eSeason) throw eSeason;
    const start = seasonRow?.start_date || undefined;
    const end = seasonRow?.end_date || undefined;

    // Try season_id first
    const bySeason = await supabase.from("matches").select("id").eq("club_id", org!.id).eq("season_id", seasonId);
    if (!bySeason.error) {
      const ids = (bySeason.data || []).map((m: any) => String(m.id));
      if (ids.length) return { matchIds: ids, method: "matches.season_id" };
    }

    // Fallback: detect a date column
    const candidates = ["date","match_date","played_at","start_time","start_date","scheduled_at","starts_at","matchDate","startTime","created_at","createdAt"];
    for (const col of candidates) {
      // eslint-disable-next-line no-await-in-loop
      const probe = await supabase.from("matches").select(`id, ${col}`).eq("club_id", org!.id).limit(1);
      if (!probe.error) {
        let q = supabase.from("matches").select(`id, ${col}`).eq("club_id", org!.id);
        if (start) q = q.gte(col, start);
        if (end) q = q.lte(col, end);
        const { data, error } = await q;
        if (error) throw error;
        return { matchIds: (data || []).map((m: any) => String(m.id)), method: `matches.${col}` };
      }
    }

    throw new Error("Could not locate a season filter on matches (no season_id and no recognizable date column).");
  }

  /** Fetch card rows; auto-detect link key; prefer club scope; filter client-side by matchIds */
  async function fetchCardsForMatches(
    table: "batting_cards" | "bowling_cards" | "fielding_cards",
    matchIds: string[]
  ): Promise<{ rows: any[]; linkKey: string | null; scopedByClub: boolean }> {
    const linkKey = await detectLinkKey(table);

    let scopedByClub = true;
    let res = await supabase.from(table).select("*").eq("club_id", org!.id);
    if (res.error) {
      scopedByClub = false;
      res = await supabase.from(table).select("*");
    }
    if (res.error) throw res.error;

    const all = (res.data || []) as any[];
    const key = linkKey ?? (all[0] ? LINK_CANDIDATES.find(k => k in all[0]) ?? null : null);

    const rows = key
      ? all.filter(r => matchIds.includes(String(r[key] ?? "")))
      : []; // can't link without a key

    return { rows, linkKey: key, scopedByClub };
  }

  /** Debug: show one bowling row's keys so we can see schema quickly */
  async function inspectBowlingSchema() {
    setSampleKeys("");
    const tryScoped = await supabase.from("bowling_cards").select("*").eq("club_id", org!.id).limit(1);
    let row = (tryScoped.data || [])[0];
    if (!row) {
      const unscoped = await supabase.from("bowling_cards").select("*").limit(1);
      row = (unscoped.data || [])[0];
    }
    const keys = row ? Object.keys(row).sort().join(", ") : "(no rows visible)";
    setSampleKeys(keys);
  }

  async function exportSeasonBowling() {
    if (!org || !seasonId) return;
    setBusy(true); setMsg(""); setDebug(""); setSampleKeys("");
    try {
      const idToName = await getPlayersMap();
      const { matchIds, method } = await getSeasonMatchIds();
      if (!matchIds.length) { setMsg("No matches found for that season."); return; }

      const { rows: bowl, linkKey: lk, scopedByClub: sc } =
        await fetchCardsForMatches("bowling_cards", matchIds);
      setDebug(`Match filter: ${method}; linkKey=${lk ?? "?"}; clubScope=${sc}; matches:${matchIds.length}; bowling rows:${bowl.length}`);

      // If still zero and we couldn't detect a link key, offer club-wide fallback
      if ((bowl.length === 0) && !lk) {
        setMsg("No bowling rows matched by season. Try the 'Download Bowling (All Club)' button to verify data presence, or use Inspect to see columns.");
        return;
      }

      const by = new Map<string, { name: string; overs: number; maidens: number; runs: number; wickets: number }>();
      for (const r of bowl) {
        const pid = String(r.player_id ?? r.playerId ?? r.player ?? "");
        const name = idToName.get(pid) || (pid ? `Player ${pid.slice(0,6)}` : "Unknown");
        if (!by.has(pid)) by.set(pid, { name, overs: 0, maidens: 0, runs: 0, wickets: 0 });

        const acc = by.get(pid)!;
        const balls = num(r, ["balls"], 0);
        let overs = num(r, ["overs","ov","o"], balls ? balls/6 : 0);
        if (!("overs" in r) && balls) overs = Math.round((balls/6)*10)/10;

        acc.overs   += overs;
        acc.maidens += num(r, ["maidens","m","maidens_bowled"], 0);
        acc.runs    += num(r, ["runs","runs_conceded","r","conceded"], 0);
        acc.wickets += num(r, ["wickets","wkts","w"], 0);
      }

      const rows: Row[] = Array.from(by.values()).map(p => ({
        Player: p.name, Overs: p.overs, Maidens: p.maidens, Runs: p.runs, Wickets: p.wickets,
      }));
      if (!rows.length) { setMsg("No bowling data for that season."); return; }
      downloadCsv(`season-bowling-${activeLabel.replace(/\s+/g,"_")}.csv`, rows, ["Player","Overs","Maidens","Runs","Wickets"]);
    } catch (e: any) {
      setMsg(e.message || "Export failed");
    } finally { setBusy(false); }
  }

  /** Club-wide fallback to sanity-check the data regardless of season linking */
  async function exportClubBowlingAllTime() {
    if (!org) return;
    setBusy(true); setMsg(""); setDebug(""); setSampleKeys("");
    try {
      const idToName = await getPlayersMap();
      // Prefer scoped by club_id; if that errors, try unscoped (RLS via matches)
      let res = await supabase.from("bowling_cards").select("*").eq("club_id", org.id);
      if (res.error) res = await supabase.from("bowling_cards").select("*");
      if (res.error) throw res.error;

      const bowl = (res.data || []) as any[];
      setDebug(`Club-wide bowling rows: ${bowl.length}`);

      const by = new Map<string, { name: string; overs: number; maidens: number; runs: number; wickets: number }>();
      for (const r of bowl) {
        const pid = String(r.player_id ?? r.playerId ?? r.player ?? "");
        const name = idToName.get(pid) || (pid ? `Player ${pid.slice(0,6)}` : "Unknown");
        if (!by.has(pid)) by.set(pid, { name, overs: 0, maidens: 0, runs: 0, wickets: 0 });
        const acc = by.get(pid)!;

        const balls = num(r, ["balls"], 0);
        let overs = num(r, ["overs","ov","o"], balls ? balls/6 : 0);
        if (!("overs" in r) && balls) overs = Math.round((balls/6)*10)/10;

        acc.overs   += overs;
        acc.maidens += num(r, ["maidens","m","maidens_bowled"], 0);
        acc.runs    += num(r, ["runs","runs_conceded","r","conceded"], 0);
        acc.wickets += num(r, ["wickets","wkts","w"], 0);
      }

      const rows: Row[] = Array.from(by.values()).map(p => ({
        Player: p.name, Overs: p.overs, Maidens: p.maidens, Runs: p.runs, Wickets: p.wickets,
      }));
      if (!rows.length) { setMsg("No bowling rows visible for this club."); return; }
      downloadCsv(`club-bowling-all-time.csv`, rows, ["Player","Overs","Maidens","Runs","Wickets"]);
    } catch (e: any) {
      setMsg(e.message || "Club-wide export failed");
    } finally { setBusy(false); }
  }

  async function exportSeasonMVP() {
    if (!org || !seasonId) return;
    setBusy(true); setMsg(""); setDebug(""); setSampleKeys("");
    try {
      const idToName = await getPlayersMap();
      const { matchIds, method } = await getSeasonMatchIds();
      if (!matchIds.length) { setMsg("No matches found for that season."); return; }

      const [{ rows: bat, linkKey: lkB, scopedByClub: scB }, { rows: bowl, linkKey: lkBo }, { rows: field, linkKey: lkF }] =
        await Promise.all([
          fetchCardsForMatches("batting_cards", matchIds),
          fetchCardsForMatches("bowling_cards", matchIds),
          fetchCardsForMatches("fielding_cards", matchIds),
        ]);
      setDebug(`Match filter: ${method}; linkKeys bat=${lkB ?? "?"}, bowl=${lkBo ?? "?"}, field=${lkF ?? "?"}; clubScope=${scB}; matches:${matchIds.length}; bat:${bat.length} bowl:${bowl.length} field:${field.length}`);

      // scoring engine (optional)
      const engine = await import("@/lib/scoring/engine").catch(() => null);
      const DEFAULT_FORMULA = engine?.DEFAULT_FORMULA ?? {
        batting: { run: 1, four: 1, six: 2, fifty: 10, hundred: 20, dot: 0, dismissal: 0 },
        bowling: { wicket: 25, maiden: 5, run: -1, over: 0 },
        fielding: { catch: 8, stumping: 10, runout: 10, drop_penalty: -2, misfield_penalty: -1 },
      };
      const calcBat = engine?.calcBattingPoints;
      const calcBowl = engine?.calcBowlingPoints;
      const calcField = engine?.calcFieldingPoints;

      type Tot = {
        name: string;
        runs: number; fours: number; sixes: number; balls: number;
        wickets: number; maidens: number; catches: number; stumpings: number; runouts: number;
        pointsBat: number; pointsBowl: number; pointsField: number;
      };
      const by = new Map<string, Tot>();
      const ensure = (pid: string) => {
        const nm = idToName.get(pid) || (pid ? `Player ${pid.slice(0,6)}` : "Unknown");
        if (!by.has(pid)) by.set(pid, {
          name: nm, runs:0,fours:0,sixes:0,balls:0, wickets:0,maidens:0,catches:0,stumpings:0,runouts:0, pointsBat:0,pointsBowl:0,pointsField:0
        });
        return by.get(pid)!;
      };

      for (const r of bat) {
        const pid = String(r.player_id ?? r.playerId ?? r.player ?? "");
        const t = ensure(pid);
        const runs = num(r, ["runs","r","score"], 0);
        const balls = num(r, ["balls","bf","deliveries"], 0);
        const fours = num(r, ["fours","x4","b4"], 0);
        const sixes = num(r, ["sixes","x6","b6"], 0);
        t.runs += runs; t.balls += balls; t.fours += fours; t.sixes += sixes;
        if (calcBat) t.pointsBat += calcBat(DEFAULT_FORMULA.batting, { runs, balls, fours, sixes, dismissal: (r as any).dismissal });
      }

      for (const r of bowl) {
        const pid = String(r.player_id ?? r.playerId ?? r.player ?? "");
        const t = ensure(pid);
        const balls = num(r, ["balls"], 0);
        const overs = num(r, ["overs","ov","o"], balls ? balls/6 : 0);
        const maidens = num(r, ["maidens","m","maidens_bowled"], 0);
        const runs = num(r, ["runs","runs_conceded","r","conceded"], 0);
        const wickets = num(r, ["wickets","wkts","w"], 0);
        t.wickets += wickets; t.maidens += maidens;
        if (calcBowl) t.pointsBowl += calcBowl(DEFAULT_FORMULA.bowling, { overs, maidens, runs, wickets });
      }

      for (const r of field) {
        const pid = String(r.player_id ?? r.playerId ?? r.player ?? "");
        const t = ensure(pid);
        const catches = num(r, ["catches","ct"], 0);
        const stumpings = num(r, ["stumpings","st"], 0);
        const runouts = num(r, ["runouts","ro"], 0);
        const drops = num(r, ["drops"], 0);
        const misfields = num(r, ["misfields"], 0);
        t.catches += catches; t.stumpings += stumpings; t.runouts += runouts;
        if (calcField) t.pointsField += calcField(DEFAULT_FORMULA.fielding, { catches, stumpings, runouts, drops, misfields } as any);
      }

      // Ensure all players appear
      const { data: players } = await supabase.from("players").select("id, name").eq("club_id", org.id);
      for (const p of players || []) {
        const pid = String(p.id);
        if (!by.has(pid)) by.set(pid, {
          name: p.name || pid,
          runs:0,fours:0,sixes:0,balls:0, wickets:0,maidens:0,catches:0,stumpings:0,runouts:0,
          pointsBat:0,pointsBowl:0,pointsField:0
        });
      }

      const rows: Row[] = Array.from(by.values())
        .map((t) => {
          const total = t.pointsBat + t.pointsBowl + t.pointsField;
          const f50 = t.runs >= 50 ? 1 : 0;
          const f100 = t.runs >= 100 ? 1 : 0;
          return {
            Player: t.name,
            Runs: t.runs, "4s": t.fours, "6s": t.sixes, Balls: t.balls, "50+": f50, "100+": f100,
            Wickets: t.wickets, Maidens: t.maidens,
            Catches: t.catches, Stumpings: t.stumpings, "Run-Outs": t.runouts,
            "Batting Points": t.pointsBat, "Bowling Points": t.pointsBowl, "Fielding Points": t.pointsField,
            "Total Points": total,
          };
        })
        .sort((a, b) => Number(b["Total Points"]) - Number(a["Total Points"]));

      if (!rows.length) { setMsg("No season data found."); return; }
      const headers = [
        "Player","Runs","4s","6s","Balls","50+","100+",
        "Wickets","Maidens","Catches","Stumpings","Run-Outs",
        "Batting Points","Bowling Points","Fielding Points","Total Points"
      ];
      downloadCsv(`season-mvp-${activeLabel.replace(/\s+/g,"_")}.csv`, rows, headers);
    } catch (e: any) {
      setMsg(e.message || "Export failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Season Exports</h1>
        {!org && <p className="text-sm text-gray-600">Select or create a club to export.</p>}
      </header>

      <section className="p-4 rounded-2xl shadow bg-white">
        <h2 className="font-semibold mb-2">Choose season</h2>
        <div className="flex flex-wrap items-center gap-3">
          <select className="border rounded px-3 py-2" value={seasonId} onChange={(e) => setSeasonId(e.target.value)} disabled={!seasons.length}>
            {seasons.map(s => (<option key={s.id} value={s.id}>{s.name}{s.is_active ? " (active)" : ""}</option>))}
          </select>

          <button className={`px-4 py-2 rounded text-white ${busy || !seasonId ? "bg-gray-400" : "bg-black"}`} disabled={busy || !seasonId} onClick={exportSeasonMVP}>
            Download Season MVP (CSV)
          </button>

          <button className={`px-4 py-2 rounded text-white ${busy || !seasonId ? "bg-gray-400" : "bg-sky-600"}`} disabled={busy || !seasonId} onClick={exportSeasonBowling}>
            Download Bowling O-M-R-W (CSV)
          </button>

          {/* Debug helpers */}
          <button className={`px-3 py-2 rounded border ${busy ? "opacity-50" : ""}`} disabled={busy} onClick={inspectBowlingSchema} title="Show the actual columns in bowling_cards">
            Inspect Bowling Columns
          </button>
          <button className={`px-3 py-2 rounded border ${busy ? "opacity-50" : ""}`} disabled={busy} onClick={exportClubBowlingAllTime} title="Export all bowling (club-wide), ignoring season filters">
            Download Bowling (All Club)
          </button>
        </div>

        {msg && <p className="text-sm text-amber-700 mt-2">{msg}</p>}
        {debug && <p className="text-xs text-gray-500 mt-1">{debug}</p>}
        {sampleKeys && <p className="text-xs text-gray-500 mt-1">bowling_cards keys: {sampleKeys}</p>}
      </section>
    </div>
  );
}
