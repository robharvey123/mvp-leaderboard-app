import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc as any;

export type Batter = { name: string; runs: number; balls?: number; howOut?: string };
export type Bowler = { name: string; overs?: number; maidens?: number; runs?: number; wickets: number };
export type TeamInnings = { team: string; batters: Batter[]; bowlers: Bowler[]; total?: number };
export type Scorecard = {
  matchIdHint?: string;
  date?: string;
  venue?: string;
  home: TeamInnings;
  away: TeamInnings;
  resultLine?: string;
};

export async function extractPdfText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const lines: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    lines.push(...tc.items.map((it: any) => String(it.str)));
    lines.push("\n---PAGE---\n");
  }
  return lines.join("\n");
}

export function parseScorecard(txt: string): Scorecard {
  const lines = txt.split(/\n+/).map(l => l.trim()).filter(Boolean);

  const headerIdx = lines.findIndex(l => /Scorecard/i.test(l));
  const date = lines.find(l => /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/.test(l)) || undefined;
  const venue = lines.find(l => /Ground|Venue|at /.test(l)) || undefined;

  function findSection(startLabel: RegExp, endLabel: RegExp) {
    const s = lines.findIndex(l => startLabel.test(l));
    if (s === -1) return [];
    let e = lines.slice(s + 1).findIndex(l => endLabel.test(l));
    if (e === -1) e = lines.length - (s + 1);
    return lines.slice(s + 1, s + 1 + e);
  }

  const batA = findSection(/Batting/i, /Extras|Fall of wickets|Bowling/i);
  const bowlB = findSection(/Bowling/i, /Batting|Result|Innings/i);
  const batB = (() => {
    const afterBowl = lines.findIndex(l => /Bowling/i.test(l));
    if (afterBowl === -1) return [];
    const rest = lines.slice(afterBowl + 1);
    const s = rest.findIndex(l => /Batting/i.test(l));
    if (s === -1) return [];
    const e = rest.slice(s + 1).findIndex(l => /Extras|Fall of wickets|Bowling|Result/i.test(l));
    return rest.slice(s + 1, s + 1 + (e === -1 ? rest.length : e));
  })();
  const bowlA = (() => {
    const lastBatIdx = lines.findLastIndex?.((l) => /Batting/i.test(l)) ?? lines.length - 1;
    const rest = lines.slice(lastBatIdx + 1);
    const s = rest.findIndex(l => /Bowling/i.test(l));
    if (s === -1) return [];
    const e = rest.slice(s + 1).findIndex(l => /Result|Innings|Umpires/i.test(l));
    return rest.slice(s + 1, s + 1 + (e === -1 ? rest.length : e));
  })();

  const resultLine = lines.find(l => /Result|won by|tied|drawn/i.test(l));

  const parseBatter = (l: string): Batter | null => {
    const m = l.match(/^(.+?)\s+(?:c .*? b .*?|b .*?|lbw|st .*?|run out|not out|retired hurt|.*?out)?\s+(\d{1,3})(?:\s*\((\d{1,3})\))?/i);
    if (!m) return null;
    return { name: cleanName(m[1]), runs: +m[2], balls: m[3] ? +m[3] : undefined, howOut: l };
  };
  const parseBowler = (l: string): Bowler | null => {
    const m = l.match(/^(.+?)\s+(\d+(?:\.\d+)?)-(\d+)-(\d+)-(\d+)/);
    if (!m) return null;
    return { name: cleanName(m[1]), overs: +m[2], maidens: +m[3], runs: +m[4], wickets: +m[5] };
  };
  const cleanName = (n: string) => n.replace(/\s{2,}/g, " ").replace(/\s+$/, "");

  const battersA = batA.map(parseBatter).filter(Boolean) as Batter[];
  const bowlersB = bowlB.map(parseBowler).filter(Boolean) as Bowler[];
  const battersB = batB.map(parseBatter).filter(Boolean) as Batter[];
  const bowlersA = bowlA.map(parseBowler).filter(Boolean) as Bowler[];

  const homeName = (lines.find((l, i) => /Batting/i.test(l) && i > headerIdx - 2)?.replace(/Batting/i, "") || "Home").trim();
  const awayName = (lines.findLast?.((l: string) => /Batting/i.test(l)) || "Away").replace(/Batting/i, "").trim();

  return {
    matchIdHint: lines.find(l => /Match ID|Match No/i.test(l)) || undefined,
    date,
    venue,
    resultLine,
    home: { team: homeName || "Home", batters: battersA, bowlers: bowlersA },
    away: { team: awayName || "Away", batters: battersB, bowlers: bowlersB },
  };
}
