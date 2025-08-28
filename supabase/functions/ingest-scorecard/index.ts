// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
  "Content-Type": "application/json",
} as const;

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

type Mode = "archive-only" | "write-minimal" | "parse-and-write";
type IngestBody = {
  mode?: Mode;
  clubId: string | null;
  teamId: string | null;
  seasonId: string | null;
  bucket: string;
  path: string;
};

const isUuid = (s: unknown) =>
  typeof s === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s.trim());
const traceId = () => crypto.randomUUID().slice(0, 8);
async function sha256(input: string) {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
function extractPlayCricketId(pathOrUrl: string): string | null {
  return (/results_(\d+)_/i.exec(pathOrUrl)?.[1] || /scorecard_id=(\d+)/i.exec(pathOrUrl)?.[1] || null);
}
function toIsoDate(dmy: string): string | null {
  const m = dmy.match(/\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i);
  if (!m) return null;
  const day = +m[1];
  const months = ["january","february","march","april","may","june","july","august","september","october","november","december"];
  const month = months.indexOf(m[2].toLowerCase()) + 1; if (!month) return null;
  return `${m[3]}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}

type ParsedBasics = {
  match: { opponent: string | null; match_date: string | null };
  teams: { teamA: string | null; teamB: string | null };
  totals: {
    teamA: { runs: number; wickets: number; overs: number } | null;
    teamB: { runs: number; wickets: number; overs: number } | null;
  };
};

function parseBasics(text: string, ourTeamName?: string | null): ParsedBasics {
  const mTeams = text.match(/^\s*([A-Za-z0-9'&.\-\/ ]+?)\s+v\s+([A-Za-z0-9'&.\-\/ ]+?)\s*$/mi);
  const teamA = mTeams?.[1]?.trim() ?? null;
  const teamB = mTeams?.[2]?.trim() ?? null;

  const mDate = text.match(/\b\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/i);
  const match_date = mDate ? toIsoDate(mDate[0]) : null;

  let opponent: string | null = null;
  const our = (ourTeamName || "").toLowerCase();
  if (teamA && teamB) {
    const aL = teamA.toLowerCase(), bL = teamB.toLowerCase();
    if (our && aL.includes(our) && !bL.includes(our)) opponent = teamB;
    else if (our && bL.includes(our) && !aL.includes(our)) opponent = teamA;
    else opponent = teamB;
  }

  function findTotals(nameGuess: string | null) {
    if (!nameGuess) return null;
    const i = text.toLowerCase().indexOf(nameGuess.toLowerCase());
    const block = i >= 0 ? text.slice(i, i + 1200) : text;
    const re = new RegExp(
      String.raw`(?:^|\s)(\d{1,3})\s*(?:\/|\s+for\s+)(all out|(\d{1,2}))[\s\S]{0,120}?(\d{1,2}(?:\.\d)?)\s*overs`,
      "i"
    );
    const m = block.match(re); if (!m) return null;
    const runs = parseInt(m[1], 10);
    const wickets = m[2].toLowerCase() === "all out" ? 10 : parseInt(m[3], 10);
    const overs = parseFloat(m[4]);
    return { runs, wickets, overs };
  }

  return {
    match: { opponent, match_date },
    teams: { teamA, teamB },
    totals: { teamA: findTotals(teamA), teamB: findTotals(teamB) },
  };
}

// Minimal parsing helpers
function between(text: string, start: RegExp, stop: RegExp) {
  const s = text.search(start); if (s < 0) return "";
  const tail = text.slice(s);
  const e = tail.search(stop);
  return e < 0 ? tail : tail.slice(0, e);
}
function parseBattingLines(textBlock: string) {
  const out: Array<{ name: string; runs: number; how_out?: string | null; position?: number | null }> = [];
  const lines = textBlock.split(/\n+/).map(l => l.trim()).filter(Boolean);
  let pos = 0;
  for (const ln of lines) {
    if (/^extras\b/i.test(ln) || /^total\b/i.test(ln)) break;
    const m = ln.match(/(.+?)\s+(\d{1,3})\s*$/);
    if (!m) continue;
    const nameAndDismissal = m[1].replace(/^\d+\.\s*/, "").trim();
    const runs = parseInt(m[2], 10);
    const name = nameAndDismissal.split(/\s{2,}| {1}c | {1}b | {1}lbw | {1}st | {1}run out/i)[0].trim();
    const how_outMatch = nameAndDismissal.replace(name, "").trim();
    pos += 1;
    out.push({ name, runs, how_out: how_outMatch || null, position: pos });
  }
  return out;
}
function parseBowlingLines(textBlock: string) {
  const out: Array<{ name: string; overs: number; maidens?: number | null; runs: number; wickets: number }> = [];
  const lines = textBlock.split(/\n+/).map(l => l.trim()).filter(Boolean);
  for (const ln of lines) {
    const m = ln.match(/^(.+?)\s+(\d{1,2}(?:\.\d)?)\s+(\d{1,2})\s+(\d{1,3})\s+(\d{1,2})$/);
    if (!m) continue;
    const name = m[1].trim();
    out.push({ name, overs: parseFloat(m[2]), maidens: parseInt(m[3], 10), runs: parseInt(m[4], 10), wickets: parseInt(m[5], 10) });
  }
  return out;
}

// Lazy PDF text extraction so OPTIONS never crashes
async function pdfBytesToTextLazy(pdfBytes: ArrayBuffer): Promise<string> {
  const mod = await import("https://esm.sh/pdfjs-dist@4.6.82/legacy/build/pdf.mjs");
  const pdfjs = (mod as any).default ?? mod;
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfBytes) } as any);
  const pdf = await loadingTask.promise;
  let text = "";
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const lines = content.items.map((it: any) => (typeof it.str === "string" ? it.str : (it?.text ?? "")));
    text += lines.join("\n") + "\n";
  }
  return text;
}

// Resolve name → player_id via aliases or players.name (best-effort)
async function resolvePlayerId(supabase: ReturnType<typeof createClient>, teamId: string, name: string) {
  const alias = name.trim();
  const { data: a } = await supabase
    .from("player_aliases")
    .select("player_id")
    .eq("team_id", teamId)
    .eq("alias_lower", alias.toLowerCase())
    .maybeSingle();
  if (a?.player_id) return a.player_id as string;

  const { data: p } = await supabase
    .from("players")
    .select("id")
    .ilike("name", alias)
    .limit(1)
    .maybeSingle();
  return p?.id ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  const tid = traceId();
  const reply = (obj: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify({ traceId: tid, ...obj }, null, 2), { status, headers: cors });

  try {
    const body = (await req.json()) as IngestBody;

    if (!body?.bucket || !body?.path) {
      return reply({ ok: false, error: "Missing bucket/path" }, 400);
    }

    // storage sanity
    const folder = body.path.split("/").slice(0, -1).join("/") || "";
    const { error: listErr } = await supabaseAdmin.storage.from(body.bucket).list(folder, { limit: 1 });
    if (listErr) return reply({ ok: false, error: `Storage access failed: ${listErr.message}` }, 400);

    const playCricketId = extractPlayCricketId(body.path);

    if (body.mode === "archive-only" || !body.mode) {
      return reply({ ok: true, mode: "archive-only", source: { bucket: body.bucket, path: body.path }, playCricketId });
    }

    if (!isUuid(body.clubId) || !isUuid(body.teamId) || !isUuid(body.seasonId)) {
      return reply({ ok: false, error: "Invalid or missing clubId/teamId/seasonId" }, 400);
    }
    const clubId = body.clubId!, teamId = body.teamId!, seasonId = body.seasonId!;
    const importHash = await sha256(`${body.bucket}:${body.path}`);

    // Upsert match shell
    const shellRow = {
      club_id: clubId, team_id: teamId, season_id: seasonId,
      opponent: "Unknown", venue: null as string | null, competition: null as string | null, result: null as string | null,
      match_date: new Date().toISOString().slice(0, 10),
      play_cricket_id: playCricketId, source_bucket: body.bucket, source_path: body.path,
      import_hash: importHash, imported_at: new Date().toISOString(),
    };
    const { data: up, error: upErr } = await supabaseAdmin.from("matches").upsert(shellRow, { onConflict: "import_hash" }).select("id").single();
    if (upErr) return reply({ ok: false, error: `Upsert matches failed: ${upErr.message}` }, 500);
    const matchId = up.id as string;

    // Ensure innings shells
    const { error: innShellErr } = await supabaseAdmin.from("innings").upsert([
      { match_id: matchId, team_id: teamId, is_batting: true,  runs: 0, wickets: 0, overs: 0 },
      { match_id: matchId, team_id: teamId, is_batting: false, runs: 0, wickets: 0, overs: 0 },
    ], { onConflict: "match_id,team_id,is_batting" });
    if (innShellErr) return reply({ ok: false, error: `Upsert innings failed: ${innShellErr.message}` }, 500);

    if (body.mode === "write-minimal") {
      return reply({ ok: true, mode: "write-minimal", matchId, importHash, source: { bucket: body.bucket, path: body.path }, playCricketId });
    }

    // parse-and-write
    const { data: teamRec } = await supabaseAdmin.from("teams").select("name").eq("id", teamId).single();
    const ourTeamName = teamRec?.name || null;

    const { data: signed, error: signErr } = await supabaseAdmin.storage.from(body.bucket).createSignedUrl(body.path, 60);
    if (signErr) return reply({ ok: false, error: `Sign URL failed: ${signErr.message}` }, 500);
    const pdfResp = await fetch(signed.signedUrl);
    if (!pdfResp.ok) return reply({ ok: false, error: `Fetch PDF failed: ${pdfResp.status}` }, 500);
    const pdfBytes = await pdfResp.arrayBuffer();

    let rawText = "", parsedSummary: any = null, parseError: string | null = null;
    const unresolved: Array<{ name: string; role: 'bat'|'bowl' }> = [];

    try {
      const mod = await import("https://esm.sh/pdfjs-dist@4.6.82/legacy/build/pdf.mjs");
      const pdfjs = (mod as any).default ?? mod;
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfBytes) } as any);
      const pdf = await loadingTask.promise;
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        const lines = content.items.map((it: any) => (typeof it.str === "string" ? it.str : (it?.text ?? "")));
        rawText += lines.join("\n") + "\n";
      }

      const basics = parseBasics(rawText, ourTeamName);
      parsedSummary = { match: basics.match, teams: basics.teams, totals: basics.totals };

      // Update match meta
      const mu: Record<string, any> = {};
      if (basics.match.match_date) mu.match_date = basics.match.match_date;
      if (basics.match.opponent)   mu.opponent   = basics.match.opponent;
      if (playCricketId)           mu.play_cricket_id = playCricketId;
      if (Object.keys(mu).length) await supabaseAdmin.from("matches").update(mu).eq("id", matchId);

      // Totals (our vs opp)
      const ourIsA = basics.teams.teamA && ourTeamName && basics.teams.teamA.toLowerCase().includes(ourTeamName.toLowerCase());
      const ours   = ourIsA ? basics.totals.teamA : basics.totals.teamB;
      const opps   = ourIsA ? basics.totals.teamB : basics.totals.teamA;

      const rowsI: any[] = [];
      if (ours) rowsI.push({ match_id: matchId, team_id: teamId, is_batting: true,  runs: ours.runs, wickets: ours.wickets, overs: ours.overs });
      if (opps) rowsI.push({ match_id: matchId, team_id: teamId, is_batting: false, runs: opps.runs, wickets: opps.wickets, overs: opps.overs });
      if (rowsI.length) await supabaseAdmin.from("innings").upsert(rowsI, { onConflict: "match_id,team_id,is_batting" });

      // ---- Parse batting/bowling text blocks (minimal) ----
      const battingBlock = between(rawText, /Batting/i, /Bowling|Fall of Wickets|Did not bat|Extras|Total/i);
      const bowlingBlock = between(rawText, /Bowling/i, /Batting|Fall of Wickets|Did not bat|Extras|Total/i);

      const batting = parseBattingLines(battingBlock);
      const bowling = parseBowlingLines(bowlingBlock);

      // Resolve & upsert cards; collect unresolved
      const batRows: any[] = [];
      for (const b of batting) {
        const pid = await resolvePlayerId(supabaseAdmin, teamId, b.name);
        if (!pid) { unresolved.push({ name: b.name, role: 'bat' }); continue; }
        batRows.push({
          match_id: matchId, player_id: pid, runs: b.runs, balls: null, fours: null, sixes: null,
          how_out: b.how_out ?? null, position: b.position ?? null
        });
      }
      if (batRows.length) await supabaseAdmin.from("batting_cards").upsert(batRows, { onConflict: "match_id,player_id" });

      const bowlRows: any[] = [];
      for (const bw of bowling) {
        const pid = await resolvePlayerId(supabaseAdmin, teamId, bw.name);
        if (!pid) { unresolved.push({ name: bw.name, role: 'bowl' }); continue; }
        bowlRows.push({
          match_id: matchId, player_id: pid, overs: bw.overs, maidens: bw.maidens ?? null, runs: bw.runs, wickets: bw.wickets,
          wides: null, no_balls: null
        });
      }
      if (bowlRows.length) await supabaseAdmin.from("bowling_cards").upsert(bowlRows, { onConflict: "match_id,player_id" });

      // Persist text + parsed json
      await supabaseAdmin.from("match_imports").upsert({ match_id: matchId, raw_text: rawText, parsed_json: parsedSummary });

      // Persist unresolved aliases for this match (unique per match/name/role)
      if (unresolved.length) {
        const rows = unresolved.map(u => ({ match_id: matchId, team_id: teamId, name: u.name, role: u.role }));
        await supabaseAdmin.from("import_unresolved_names").upsert(rows, { onConflict: "match_id,team_id,name,role" });
      }
    } catch (e: any) {
      parseError = `PDF parse failed: ${e?.message || String(e)}`;
    }

    var parseError: string | null = null;
    return reply({
      ok: true,
      mode: "parse-and-write",
      matchId,
      importHash,
      source: { bucket: body.bucket, path: body.path },
      playCricketId,
      parsedSummary,
      parseError
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return reply({ ok: false, error: msg }, 500);
  }
});
