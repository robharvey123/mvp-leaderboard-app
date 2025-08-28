// src/lib/scoring/engine.ts
export type Formula = {
  batting: {
    per_run: number;
    boundary_4: number;
    boundary_6: number;
    milestones?: Array<{ at: number; bonus: number }>;
    duck_penalty?: number;
  };
  bowling: {
    per_wicket: number;
    maiden_over: number;
    three_for_bonus?: number;
    five_for_bonus?: number;
    economy_bands?: Array<
      | { max: number; bonus: number }   // Econ <= max → +bonus
      | { min: number; penalty: number } // Econ >= min → -penalty
    >;
  };
  fielding: {
    catch: number;
    stumping: number;
    runout: number;
    drop_penalty?: number;
    misfield_penalty?: number;
  };
};

export function calcBattingPoints(
  f: Formula["batting"],
  s: { runs: number; balls?: number; fours?: number; sixes?: number; dismissal?: string }
): number {
  const runs = s.runs ?? 0;
  const fours = s.fours ?? 0;
  const sixes = s.sixes ?? 0;

  let pts =
    runs * (f.per_run ?? 0) +
    fours * (f.boundary_4 ?? 0) +
    sixes * (f.boundary_6 ?? 0);

  // milestones
  if (Array.isArray(f.milestones)) {
    for (const m of f.milestones) {
      if (runs >= (m.at ?? Infinity)) pts += m.bonus ?? 0;
    }
  }

  // duck penalty (only if faced balls and dismissed)
  if (runs === 0 && (s.balls ?? 0) > 0 && s.dismissal && s.dismissal !== "Did not bat") {
    pts += f.duck_penalty ?? 0;
  }

  return safeNum(pts);
}

export function calcBowlingPoints(
  f: Formula["bowling"],
  s: { overs: number; maidens?: number; runs: number; wickets: number }
): number {
  const overs = s.overs ?? 0;
  const maidens = s.maidens ?? 0;
  const runs = s.runs ?? 0;
  const wkts = s.wickets ?? 0;

  let pts =
    wkts * (f.per_wicket ?? 0) +
    maidens * (f.maiden_over ?? 0);

  if ((f.three_for_bonus ?? 0) && wkts >= 3) pts += f.three_for_bonus!;
  if ((f.five_for_bonus ?? 0) && wkts >= 5) pts += f.five_for_bonus!;

  if (overs > 0 && Array.isArray(f.economy_bands)) {
    const econ = runs / overs;
    for (const b of f.economy_bands) {
      if ("max" in b && econ <= b.max) pts += b.bonus ?? 0;
      if ("min" in b && econ >= b.min) pts += b.penalty ?? 0;
    }
  }

  return safeNum(pts);
}

export function calcFieldingPoints(
  f: Formula["fielding"],
  s: { catches?: number; stumpings?: number; runouts?: number; drops?: number; misfields?: number }
): number {
  const pts =
    (s.catches ?? 0) * (f.catch ?? 0) +
    (s.stumpings ?? 0) * (f.stumping ?? 0) +
    (s.runouts ?? 0) * (f.runout ?? 0) +
    (s.drops ?? 0) * (f.drop_penalty ?? 0) +
    (s.misfields ?? 0) * (f.misfield_penalty ?? 0);

  return safeNum(pts);
}

function safeNum(n: unknown): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}
