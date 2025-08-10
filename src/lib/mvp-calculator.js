/**
 * Brookweald CC MVP Point System
 * 
 * This module defines the data model for cricket scorecard data processing
 * and implements an MVP point calculation algorithm for the Brookweald CC app.
 */

// Types definitions for player performance data
/**
 * @typedef {Object} PlayerMVPEntry
 * @property {string} playerId - Unique player identifier
 * @property {string} playerName - Player's full name
 * @property {number} mvpPoints - Total MVP points calculated
 * @property {Object} contributions - Breakdown of contributions
 * @property {Object} contributions.batting - Batting statistics
 * @property {Object} contributions.bowling - Bowling statistics
 * @property {Object} contributions.fielding - Fielding statistics
 * @property {Object} contributions.team - Team contribution metrics
 * @property {string[]} specialAchievements - Notable performances (century, 5-wicket haul, etc.)
 */

/**
 * @typedef {Object} PlayerMatchPerformance
 * @property {string} matchId - Unique match identifier
 * @property {string} date - Match date
 * @property {string} opposition - Opposing team
 * @property {string} venue - Match venue
 * @property {boolean} isHomeMatch - Whether it was a home match
 * @property {string} competition - Competition/league name
 * @property {string} matchResult - Win/loss/draw/tie
 * @property {Object} batting - Batting performance
 * @property {number} batting.runs - Runs scored
 * @property {number} batting.balls - Balls faced
 * @property {number} batting.fours - Number of boundaries (4s)
 * @property {number} batting.sixes - Number of sixes (6s)
 * @property {string} batting.status - How out (bowled, caught, etc.) or "not out"
 * @property {number} batting.strikeRate - Runs per 100 balls
 * @property {Object} bowling - Bowling performance
 * @property {number} bowling.overs - Overs bowled
 * @property {number} bowling.maidens - Maiden overs
 * @property {number} bowling.runs - Runs conceded
 * @property {number} bowling.wickets - Wickets taken
 * @property {number} bowling.wides - Wide balls
 * @property {number} bowling.noBalls - No balls
 * @property {number} bowling.economy - Runs per over
 * @property {Object} fielding - Fielding performance
 * @property {number} fielding.catches - Catches taken
 * @property {number} fielding.stumpings - Stumpings made
 * @property {number} fielding.runOuts - Run outs effected
 * @property {Object} role - Player roles
 * @property {boolean} role.isCaptain - Whether player was captain
 * @property {boolean} role.isWicketkeeper - Whether player was wicketkeeper
 */

/**
 * Class to calculate MVP points for cricket players
 */
class MVPCalculator {
  /**
   * Calculate MVP points based on performance
   * @param {PlayerMatchPerformance} performance - Player's match performance data
   * @returns {PlayerMVPEntry} Calculated MVP points with breakdown
   */
  static calculateMVP(performance) {
    const mvp = {
      playerId: performance.playerId || '',
      playerName: performance.playerName || '',
      mvpPoints: 0,
      contributions: {
        batting: { points: 0, breakdown: {} },
        bowling: { points: 0, breakdown: {} },
        fielding: { points: 0, breakdown: {} },
        team: { points: 0, breakdown: {} }
      },
      specialAchievements: []
    };

    // Calculate batting points
    if (performance.batting && Object.keys(performance.batting).length > 0) {
      const batting = performance.batting;
      const battingPoints = this.calculateBattingPoints(batting);
      mvp.contributions.batting = battingPoints;
      mvp.mvpPoints += battingPoints.points;
      
      // Special achievements
      if (batting.runs >= 100) {
        mvp.specialAchievements.push('Century');
      } else if (batting.runs >= 50) {
        mvp.specialAchievements.push('Half Century');
      }
    }

    // Calculate bowling points
    if (performance.bowling && Object.keys(performance.bowling).length > 0) {
      const bowling = performance.bowling;
      const bowlingPoints = this.calculateBowlingPoints(bowling);
      mvp.contributions.bowling = bowlingPoints;
      mvp.mvpPoints += bowlingPoints.points;
      
      // Special achievements
      if (bowling.wickets >= 5) {
        mvp.specialAchievements.push('Five Wicket Haul');
      } else if (bowling.wickets >= 3) {
        mvp.specialAchievements.push('Three Wicket Haul');
      }
    }

    // Calculate fielding points
    if (performance.fielding) {
      const fielding = performance.fielding;
      const fieldingPoints = this.calculateFieldingPoints(fielding);
      mvp.contributions.fielding = fieldingPoints;
      mvp.mvpPoints += fieldingPoints.points;
    }

    // Calculate team contribution points
    if (performance.role) {
      const role = performance.role;
      const teamPoints = this.calculateTeamPoints(role, performance.matchResult);
      mvp.contributions.team = teamPoints;
      mvp.mvpPoints += teamPoints.points;
    }

    return mvp;
  }

  /**
   * Calculate batting points
   * @param {Object} batting - Batting performance stats
   * @returns {Object} Points and breakdown
   */
  static calculateBattingPoints(batting) {
    const result = { points: 0, breakdown: {} };
    
    // 1 point per run
    const runPoints = batting.runs || 0;
    result.breakdown.runs = runPoints;
    result.points += runPoints;
    
    // 1 extra point per boundary
    const fourPoints = (batting.fours || 0) * 1;
    result.breakdown.boundaries = fourPoints;
    result.points += fourPoints;
    
    // 2 extra points per six
    const sixPoints = (batting.sixes || 0) * 2;
    result.breakdown.sixes = sixPoints;
    result.points += sixPoints;
    
    // 10 bonus points for not out
    if (batting.status === 'not out' || batting.status === 'retired not out') {
      result.breakdown.notOut = 10;
      result.points += 10;
    }
    
    // Milestone bonus points
    if (batting.runs >= 100) {
      result.breakdown.century = 25;
      result.points += 25;
    } else if (batting.runs >= 50) {
      result.breakdown.halfCentury = 10;
      result.points += 10;
    }
    
    return result;
  }

  /**
   * Calculate bowling points
   * @param {Object} bowling - Bowling performance stats
   * @returns {Object} Points and breakdown
   */
  static calculateBowlingPoints(bowling) {
    const result = { points: 0, breakdown: {} };
    
    // 20 points per wicket
    const wicketPoints = (bowling.wickets || 0) * 20;
    result.breakdown.wickets = wicketPoints;
    result.points += wicketPoints;
    
    // 5 points per maiden
    const maidenPoints = (bowling.maidens || 0) * 5;
    result.breakdown.maidens = maidenPoints;
    result.points += maidenPoints;
    
    // Wicket haul bonus
    if (bowling.wickets >= 5) {
      result.breakdown.fiveWickets = 25;
      result.points += 25;
    } else if (bowling.wickets >= 3) {
      result.breakdown.threeWickets = 10;
      result.points += 10;
    }
    
    // Economy rate bonus (if bowled at least 3 overs)
    const overs = bowling.overs || 0;
    const economy = bowling.economy || 0;
    if (overs >= 3) {
      if (economy < 3) {
        result.breakdown.excellentEconomy = 20;
        result.points += 20;
      } else if (economy < 4.5) {
        result.breakdown.goodEconomy = 10;
        result.points += 10;
      }
    }
    
    return result;
  }

  /**
   * Calculate fielding points
   * @param {Object} fielding - Fielding performance stats
   * @returns {Object} Points and breakdown
   */
  static calculateFieldingPoints(fielding) {
    const result = { points: 0, breakdown: {} };
    
    // 10 points per catch
    const catchPoints = (fielding.catches || 0) * 10;
    result.breakdown.catches = catchPoints;
    result.points += catchPoints;
    
    // 15 points per stumping
    const stumpingPoints = (fielding.stumpings || 0) * 15;
    result.breakdown.stumpings = stumpingPoints;
    result.points += stumpingPoints;
    
    // 10 points per run out
    const runOutPoints = (fielding.runOuts || 0) * 10;
    result.breakdown.runOuts = runOutPoints;
    result.points += runOutPoints;
    
    return result;
  }

  /**
   * Calculate team contribution points
   * @param {Object} role - Player role
   * @param {string} matchResult - Match result
   * @returns {Object} Points and breakdown
   */
  static calculateTeamPoints(role, matchResult) {
    const result = { points: 0, breakdown: {} };
    
    // 10 bonus points for captain if team wins
    if (role.isCaptain && matchResult && matchResult.toLowerCase().includes('win')) {
      result.breakdown.captainWin = 10;
      result.points += 10;
    }
    
    return result;
  }
}

// Function to convert the extracted scorecard data to our standard format
function convertScorecardToMVPFormat(scorecardData) {
  const players = [];
  const matchData = {
    matchId: `BW-${scorecardData.match_info.date.replace(/\s+/g, '-')}`,
    date: scorecardData.match_info.date,
    opposition: scorecardData.match_info.team1,
    venue: scorecardData.match_info.venue || "Unknown",
    isHomeMatch: true,
    competition: scorecardData.match_info.competition,
    matchResult: scorecardData.match_info.result
  };
  
  // Convert each player record to our MVP format
  Object.values(scorecardData.players).forEach(player => {
    const playerPerformance = {
      ...matchData,
      playerId: `player-${player.name.toLowerCase().replace(/\s+/g, '-')}`,
      playerName: player.name,
      batting: {
        runs: player.batting.runs || 0,
        balls: player.batting.balls || 0,
        fours: player.batting.fours || 0,
        sixes: player.batting.sixes || 0,
        status: player.batting.status || '',
        strikeRate: player.batting.strike_rate || 0
      },
      bowling: {
        overs: player.bowling.overs || 0,
        maidens: player.bowling.maidens || 0,
        runs: player.bowling.runs || 0,
        wickets: player.bowling.wickets || 0,
        wides: player.bowling.wides || 0,
        noBalls: player.bowling.no_balls || 0,
        economy: player.bowling.economy || 0
      },
      fielding: {
        catches: player.fielding.catches || 0,
        stumpings: player.fielding.stumpings || 0,
        runOuts: player.fielding.run_outs || 0
      },
      role: {
        isCaptain: player.is_captain || false,
        isWicketkeeper: player.is_wicketkeeper || false
      }
    };
    
    // Calculate MVP points
    const mvpEntry = MVPCalculator.calculateMVP(playerPerformance);
    
    // Add the calculated MVP points and player performance to our result
    players.push({
      mvp: mvpEntry,
      performance: playerPerformance
    });
  });
  
  return {
    match: matchData,
    players: players.sort((a, b) => b.mvp.mvpPoints - a.mvp.mvpPoints)
  };
}

export { MVPCalculator, convertScorecardToMVPFormat };