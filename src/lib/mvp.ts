// Simple MVP points calculator (tweak weights later)
export function pointsForBatting({
  runs, fours, sixes, fifty, hundred,
}: { runs: number; fours: number; sixes: number; fifty: boolean; hundred: boolean; }) {
  let p = 0;
  p += runs;           // 1 pt per run
  p += fours * 1;      // +1 per 4
  p += sixes * 2;      // +2 per 6
  if (fifty) p += 10;  // bonus
  if (hundred) p += 25;
  return p;
}

export function pointsForBowling({
  overs, maidens, runs, wickets, three_wkts, five_wkts,
}: { overs: number; maidens: number; runs: number; wickets: number; three_wkts: boolean; five_wkts: boolean; }) {
  let p = 0;
  p += wickets * 20;        // wicket premium
  p += maidens * 4;
  p += Math.floor(overs);   // small credit for bowling overs
  p += three_wkts ? 10 : 0;
  p += five_wkts ? 30 : 0;
  p -= Math.max(0, runs - wickets * 10) * 0.5; // light economy penalty
  return Math.round(p);
}

export function pointsForFielding({ catches, stumpings, runouts }:{ catches:number; stumpings:number; runouts:number; }) {
  return catches * 5 + stumpings * 8 + runouts * 8;
}
