// src/lib/calcPoints.ts
export type PointsConfig = {
  batting_run: number;
  fifty_bonus: number;
  hundred_bonus: number;
  wicket: number;
  maiden: number;
  catch: number;
  stumping: number;
  runout: number;
  assist: number;
  duck_penalty: number;
  drop_penalty: number;
};

export function calcPoints(
  batting?: { runs?: number; fours?: number; sixes?: number },
  bowling?: { wickets?: number; maidens?: number },
  fielding?: { catches?: number; stumpings?: number; runouts?: number; assists?: number },
  penalties?: { ducks?: number; drops?: number },
  cfg: PointsConfig = {
    batting_run: 1, fifty_bonus: 0, hundred_bonus: 0,
    wicket: 20, maiden: 4, catch: 5, stumping: 7, runout: 6, assist: 3,
    duck_penalty: 5, drop_penalty: 2
  }
) {
  const runs = batting?.runs || 0;
  const battingPts =
    runs * cfg.batting_run +
    (runs >= 50 && runs < 100 ? cfg.fifty_bonus : 0) +
    (runs >= 100 ? cfg.hundred_bonus : 0);

  const bowlingPts = (bowling?.wickets || 0) * cfg.wicket + (bowling?.maidens || 0) * cfg.maiden;

  const fieldingPts =
    (fielding?.catches || 0) * cfg.catch +
    (fielding?.stumpings || 0) * cfg.stumping +
    (fielding?.runouts || 0) * cfg.runout +
    (fielding?.assists || 0) * cfg.assist;

  const penaltyPts =
    (penalties?.ducks || 0) * cfg.duck_penalty +
    (penalties?.drops || 0) * cfg.drop_penalty;

  return { battingPts, bowlingPts, fieldingPts, penaltyPts, total: battingPts + bowlingPts + fieldingPts - penaltyPts };
}
