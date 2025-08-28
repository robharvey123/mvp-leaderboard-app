import type { PlayerSeason, PlayerMatch, TeamStats } from "../charts";

export const teams = [
  { label: "Overall", value: "overall" },
  { label: "1st XI", value: "1stXI" },
  { label: "2nd XI", value: "2ndXI" },
];

// --- Mock PlayerSeason aggregates by team ---
export const playersByTeam: Record<string, PlayerSeason[]> = {
  overall: [
    { player: 'Danny Finch', totalPoints: 1699, battingPoints: 1181, bowlingPoints: 405, fieldingPoints: 90, runs: 930, wickets: 21, sixes: 24, fours: 102, catches: 9 },
    { player: 'Saf Abbas', totalPoints: 1375, battingPoints: 592, bowlingPoints: 735, fieldingPoints: 50, runs: 540, wickets: 31, sixes: 9, fours: 66, catches: 6 },
    { player: 'Alfie Hedges', totalPoints: 1355, battingPoints: 815, bowlingPoints: 465, fieldingPoints: 100, runs: 771, wickets: 18, sixes: 12, fours: 88, catches: 11 },
    { player: 'Rob Harvey', totalPoints: 1105, battingPoints: 970, bowlingPoints: 135, fieldingPoints: 30, runs: 888, wickets: 3, sixes: 7, fours: 94, catches: 3, dropped: 2 },
  ],
  "1stXI": [
    { player: 'Danny Finch', totalPoints: 1124, battingPoints: 810, bowlingPoints: 245, fieldingPoints: 60, runs: 650, wickets: 14, sixes: 17, fours: 79, catches: 6 },
    { player: 'Saf Abbas', totalPoints: 920, battingPoints: 360, bowlingPoints: 515, fieldingPoints: 45, runs: 295, wickets: 23, sixes: 4, fours: 40, catches: 4 },
  ],
  "2ndXI": [
    { player: 'Alfie Hedges', totalPoints: 890, battingPoints: 520, bowlingPoints: 310, fieldingPoints: 60, runs: 520, wickets: 13, sixes: 7, fours: 60, catches: 7 },
    { player: 'Rob Harvey', totalPoints: 740, battingPoints: 610, bowlingPoints: 90, fieldingPoints: 20, runs: 590, wickets: 2, sixes: 4, fours: 57, catches: 2, dropped: 2 },
  ],
};

// --- Mock PlayerMatch rows by team ---
export const matchesByTeam: Record<string, PlayerMatch[]> = {
  overall: [
    { player: 'Danny Finch', matchId: '2025-05-17-OCC', matchDate: '2025-05-17', totalPoints: 160 },
    { player: 'Danny Finch', matchId: '2025-06-14-EHC', matchDate: '2025-06-14', totalPoints: 243 },
    { player: 'Danny Finch', matchId: '2025-07-26-GW', matchDate: '2025-07-26', totalPoints: 294 },
    { player: 'Danny Finch', matchId: '2025-08-09-RAY', matchDate: '2025-08-09', totalPoints: 277 },
    { player: 'Rob Harvey', matchId: '2025-06-21-XYZ', matchDate: '2025-06-21', totalPoints: 98 },
  ],
  "1stXI": [
    { player: 'Danny Finch', matchId: '2025-05-17-OCC', matchDate: '2025-05-17', totalPoints: 160 },
    { player: 'Danny Finch', matchId: '2025-06-14-EHC', matchDate: '2025-06-14', totalPoints: 243 },
  ],
  "2ndXI": [
    { player: 'Rob Harvey', matchId: '2025-06-21-XYZ', matchDate: '2025-06-21', totalPoints: 98 },
  ],
};

// --- TeamStats by team ---
export const teamStatsByTeam: Record<string, TeamStats> = {
  overall: { runs: 5059, fifties: 23, hundreds: 9, fours: 710, sixes: 59, wickets: 219, fiveFors: 5, maidens: 118, catches: 104, runOuts: 2, assists: 7.5, stumpings: 9, ducks: 25, drops: 57 },
  "1stXI": { runs: 3120, fifties: 15, hundreds: 5, fours: 480, sixes: 41, wickets: 140, fiveFors: 3, maidens: 90, catches: 71, runOuts: 1, assists: 5, stumpings: 6, ducks: 17, drops: 31 },
  "2ndXI": { runs: 1939, fifties: 8, hundreds: 4, fours: 230, sixes: 18, wickets: 79, fiveFors: 2, maidens: 28, catches: 33, runOuts: 1, assists: 2.5, stumpings: 3, ducks: 8, drops: 26 },
};
