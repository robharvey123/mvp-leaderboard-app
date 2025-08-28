// src/lib/demoScoring.ts
export const DEFAULT_FORMULA = {
  batting: { run: 1, four: 1, six: 2 },
  bowling: { wicket: 25, maiden: 5, run: -1, over: 0 },
  fielding: { catch: 8, stumping: 10, runout: 10 },
};

export function calcBattingPoints(input: { runs: number; fours?: number; sixes?: number }) {
  const r = Number(input.runs || 0);
  const f = Number(input.fours || 0);
  const s = Number(input.sixes || 0);
  return r * DEFAULT_FORMULA.batting.run + f * DEFAULT_FORMULA.batting.four + s * DEFAULT_FORMULA.batting.six;
}

export function calcBowlingPoints(input: { overs?: number; maidens?: number; runs?: number; wickets?: number }) {
  const o = Number(input.overs || 0);
  const m = Number(input.maidens || 0);
  const r = Number(input.runs || 0);
  const w = Number(input.wickets || 0);
  return (
    w * DEFAULT_FORMULA.bowling.wicket +
    m * DEFAULT_FORMULA.bowling.maiden +
    r * DEFAULT_FORMULA.bowling.run +
    o * DEFAULT_FORMULA.bowling.over
  );
}

export function calcFieldingPoints(input: { catches?: number; stumpings?: number; runouts?: number }) {
  const c = Number(input.catches || 0);
  const st = Number(input.stumpings || 0);
  const ro = Number(input.runouts || 0);
  return (
    c * DEFAULT_FORMULA.fielding.catch +
    st * DEFAULT_FORMULA.fielding.stumping +
    ro * DEFAULT_FORMULA.fielding.runout
  );
}
