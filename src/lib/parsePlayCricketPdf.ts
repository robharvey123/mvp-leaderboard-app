// src/lib/parsePlayCricketPdf.ts
import { getDocument } from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";

// ===== Types =====
export type PlayerExtras = {
  catches: number; stumpings: number; runouts: number; assists: number; drops: number; ducks: number;
};
export type ParsedPlayer = {
  name: string;
  batting?: { runs?: number; fours?: number; sixes?: number; balls?: number };
  bowling?: { overs?: number; maidens?: number; runs?: number; wickets?: number; wides?: number; no_balls?: number };
  extras: PlayerExtras;
};
export type ParsedMatch = {
  playCricketId?: string;
  team: string;                 // '1st XI' | '2nd XI' (auto from header)
  opponent: string;
  matchDate: string;            // 'YYYY-MM-DD'
  venue?: string;
  teamScore?: string;
  opponentScore?: string;
  players: ParsedPlayer[];      // merged batting + bowling for Brookweald players
};

// ===== Helpers =====
const CLUB_NAME = /Brookweald CC/i; // tune here if club name ever changes

const pad2 = (n: string | number) => String(n).padStart(2, "0");
const num = (s?: string) => (s ? Number(String(s).replace(/[^\d.]/g, "")) : undefined);
const clean = (s: string) => s.replace(/\s{2,}/g, " ").trim();
const mon = (m: string) =>
  ({ January:"01", February:"02", March:"03", April:"04", May:"05", June:"06",
     July:"07", August:"08", September:"09", October:"10", November:"11", December:"12" } as Record<string,string>)[m] || "01";

function between(full: string, from: RegExp, to: RegExp) {
  const a = full.search(from);
  if (a < 0) return "";
  const rest = full.slice(a);
  const b = rest.search(to);
  return b < 0 ? rest : rest.slice(0, b);
}

// ===== Main parser =====
export async function parsePlayCricketPdf(file: File): Promise<ParsedMatch> {
  const buf = await file.arrayBuffer();
  const pdf = await getDocument({ data: buf }).promise;

  let full = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = (content.items as any[]).map((it) => it.str).join(" ");
    full += text + "\n";
  }

  // --- Header: "X Vs Y ... Date Saturday 9th August 2025"
  const hdr = full.match(/(.+?)\s+Vs\s+(.+?)\s+.*?Date\s+[A-Za-z]+day\s+(\d{1,2})(?:st|nd|rd|th)\s+([A-Za-z]+)\s+(\d{4})/i);
  let ours = "", opp = "", teamLabel = "1st XI", matchDate = "";
  if (hdr) {
    const A = clean(hdr[1]); const B = clean(hdr[2]);
    matchDate = `${hdr[5]}-${mon(hdr[4])}-${pad2(hdr[3])}`;
    const brookSide = CLUB_NAME.test(A) ? A : CLUB_NAME.test(B) ? B : "";
    const oppSide = brookSide === A ? B : A;
    ours = brookSide;
    opp = oppSide.replace(/\s*-\s*\d+(st|nd|rd|th)\s*XI/i, "");
    teamLabel = (brookSide.match(/(\d+(st|nd|rd|th)\s*XI)/i)?.[1] || "1st XI").replace(/\s+/g, " ");
  }

  // --- Venue (optional)
  const venue = clean((full.match(/Ground\s+(.+?)\s+Date/i)?.[1] || ""));

  // --- Scores block: "Score 264-2 (39.2 overs) 263-7 (45.0 overs)"
  let teamScore: string | undefined, opponentScore: string | undefined;
  const score = full.match(/Score\s+(\d+-\d+\s*\([^)]+\))\s+(\d+-\d+\s*\([^)]+\))/i);
  if (score) {
    const brookFirst = hdr ? CLUB_NAME.test(hdr[1]) : true;
    teamScore = brookFirst ? score[1] : score[2];
    opponentScore = brookFirst ? score[2] : score[1];
  }

  // --- Play‑Cricket ID from footer link
  const playCricketId = full.match(/results\/(\d+)\/print/i)?.[1];

  // --- Brookweald batting table
  // Section between "Brookweald CC Batting" and the next "Bowling" header
  const batSec = between(full, /Brookweald CC\s+Batting/i, /Bowling|Fall of Wicket|Match Officials|Umpires|Scorers|Referee|$/i);
  const batting: Array<{ name: string; runs?: number; fours?: number; sixes?: number; balls?: number }> = [];
  if (batSec) {
    // Flexible pattern: NAME <lots of words> then the last 4 numbers on the row = runs,4s,6s,balls
    const row = /([A-Za-z'.\- ]+?)\s+(?:(?:(?!\d{1,3}\s+\d{1,3}\s+\d{1,3}\s+\d{1,3}).)+\s+)?(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})(?!\d)/g;
    let m: RegExpExecArray | null;
    while ((m = row.exec(batSec)) !== null) {
      const name = clean(m[1]);
      if (!name || /Extras|Totals?/i.test(name)) continue;
      batting.push({ name, runs: num(m[2]), fours: num(m[3]), sixes: num(m[4]), balls: num(m[5]) });
    }
  }

  // --- Brookweald bowling table (their bowlers when the opposition batted)
  const bowlSec = between(full, /Brookweald CC\s+Bowling/i, /Match Officials|Umpires|Scorers|Referee|$/i);
  const bowling: Array<{ name: string; overs?: number; maidens?: number; runs?: number; wickets?: number; wides?: number; no_balls?: number }> = [];
  if (bowlSec) {
    const row = /([A-Za-z'.\- ]+?)\s+(\d+(?:\.\d)?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/g;
    let m: RegExpExecArray | null;
    while ((m = row.exec(bowlSec)) !== null) {
      const name = clean(m[1]);
      if (!name || /Totals?/i.test(name)) continue;
      bowling.push({
        name,
        overs: Number(m[2]),
        maidens: num(m[3]),
        runs: num(m[4]),
        wickets: num(m[5]),
        wides: num(m[6]),
        no_balls: num(m[7]),
      });
    }
  }

  // --- Merge into players[]
  const map = new Map<string, ParsedPlayer>();
  for (const b of batting) {
    map.set(b.name, { name: b.name, batting: b, extras: { catches:0, stumpings:0, runouts:0, assists:0, drops:0, ducks:0 } });
  }
  for (const o of bowling) {
    const ex = map.get(o.name);
    if (ex) ex.bowling = o;
    else map.set(o.name, { name: o.name, bowling: o, extras: { catches:0, stumpings:0, runouts:0, assists:0, drops:0, ducks:0 } });
  }

  return {
    playCricketId,
    team: teamLabel,
    opponent: opp || "Unknown Opponent",
    matchDate: matchDate || "Unknown Date",
    venue: venue || undefined,
    teamScore,
    opponentScore,
    players: Array.from(map.values()),
  };
}
