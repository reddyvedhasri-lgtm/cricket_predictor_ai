import { MatchState, PredictionResult, Team, Venue, PitchType, RiskLevel } from './types';

/**
 * Gets a random ball outcome based on current match conditions
 */
function simulateBall(
  overs: number,
  wickets: number,
  format: 'T20' | 'ODI',
  pitchType: PitchType,
  batStrength: number,
  bowlStrength: number
): { runs: number; isWicket: boolean; isExtra: boolean } {
  const totalOvers = format === 'T20' ? 20 : 50;
  
  // Base probabilities
  let dotProb = 0.35;
  let singleProb = 0.40;
  let doubleProb = 0.08;
  let boundary4Prob = 0.10;
  let boundary6Prob = 0.04;
  let wicketProb = 0.03;
  
  // Adjust based on phase of the match
  const isPowerplay = format === 'T20' ? overs < 6 : overs < 10;
  const isDeathOvers = format === 'T20' ? overs >= 16 : overs >= 40;
  
  if (isPowerplay) {
    // Powerplay: higher boundary rate, fewer dot balls, slightly higher wicket risk
    boundary4Prob += 0.04;
    boundary6Prob += 0.01;
    dotProb -= 0.05;
  } else if (isDeathOvers) {
    // Death overs: extreme aggression. High sixes, high wickets, lower dots
    boundary6Prob += 0.08;
    boundary4Prob += 0.05;
    dotProb -= 0.12;
    wicketProb += 0.045; // high risk, high reward
  } else {
    // Middle overs: consolidation. More singles, fewer boundaries, lower wickets
    singleProb += 0.05;
    boundary4Prob -= 0.03;
    boundary6Prob -= 0.02;
    wicketProb -= 0.008;
  }

  // Adjust for pitch type
  if (pitchType === 'Flat') {
    // Flat pitch: run scoring is easier
    boundary4Prob += 0.03;
    boundary6Prob += 0.02;
    dotProb -= 0.04;
    wicketProb -= 0.005;
  } else if (pitchType === 'Green') {
    // Green pitch: helps fast bowlers early on
    dotProb += 0.05;
    wicketProb += 0.01;
    boundary4Prob -= 0.02;
  } else if (pitchType === 'Dusty') {
    // Dusty pitch: helps spin, dry surface
    dotProb += 0.06;
    singleProb -= 0.02;
    boundary6Prob -= 0.015;
    wicketProb += 0.008;
  }

  // Adjust for wickets down (tailenders score slower and lose wickets faster)
  if (wickets >= 7) {
    dotProb += 0.15;
    boundary4Prob -= 0.06;
    boundary6Prob -= 0.035;
    wicketProb += 0.05; // Tail falls quickly
  } else if (wickets >= 4) {
    dotProb += 0.04;
    boundary4Prob -= 0.02;
  }

  // Adjust for team relative strengths
  const strengthDiff = batStrength - bowlStrength; // positive is bat-friendly
  boundary4Prob += strengthDiff * 0.05;
  boundary6Prob += strengthDiff * 0.03;
  dotProb -= strengthDiff * 0.05;
  wicketProb -= strengthDiff * 0.01;

  // Normalize probabilities
  const sum = dotProb + singleProb + doubleProb + boundary4Prob + boundary6Prob + wicketProb;
  const rand = Math.random() * sum;
  
  if (rand < dotProb) {
    return { runs: 0, isWicket: false, isExtra: false };
  } else if (rand < dotProb + singleProb) {
    return { runs: 1, isWicket: false, isExtra: false };
  } else if (rand < dotProb + singleProb + doubleProb) {
    return { runs: 2, isWicket: false, isExtra: false };
  } else if (rand < dotProb + singleProb + doubleProb + boundary4Prob) {
    return { runs: 4, isWicket: false, isExtra: false };
  } else if (rand < dotProb + singleProb + doubleProb + boundary4Prob + boundary6Prob) {
    return { runs: 6, isWicket: false, isExtra: false };
  } else {
    return { runs: 0, isWicket: true, isExtra: false };
  }
}

/**
 * Runs Monte Carlo simulations of the remaining match
 */
export function predictMatch(state: MatchState): PredictionResult {
  const totalOvers = state.format === 'T20' ? 20 : 50;
  const totalBalls = totalOvers * 6;
  const currentBalls = Math.min(state.overs * 6 + state.balls, totalBalls);
  const ballsRemaining = Math.max(0, totalBalls - currentBalls);
  
  const currentCRR = currentBalls > 0 ? (state.score / currentBalls) * 6 : 0;
  
  // Handle edge cases
  if (state.wickets >= 10 || currentBalls >= totalBalls) {
    const finalScore = state.score;
    const isChasingSuccess = state.target ? finalScore >= state.target : false;
    return {
      projectedScore: finalScore,
      projectedRange: [finalScore, finalScore],
      winProbability: state.innings === '1st' ? 50 : (isChasingSuccess ? 100 : 0),
      keyInsights: state.target 
        ? [isChasingSuccess ? 'Chasing team has won!' : 'Chasing team failed to reach target.']
        : ['Innings completed.'],
      riskLevel: 'Low',
      runRateRequired: null,
      currentRunRate: currentCRR
    };
  }

  const simCount = 150;
  const finalScores: number[] = [];
  let chaseSuccesses = 0;

  for (let i = 0; i < simCount; i++) {
    let simScore = state.score;
    let simWickets = state.wickets;
    let simBalls = currentBalls;

    while (simBalls < totalBalls && simWickets < 10) {
      const curOver = Math.floor(simBalls / 6);
      const outcome = simulateBall(
        curOver,
        simWickets,
        state.format,
        state.pitchType,
        state.battingTeam.battingStrength,
        state.bowlingTeam.bowlingStrength
      );

      if (outcome.isWicket) {
        simWickets++;
      } else {
        simScore += outcome.runs;
      }
      simBalls++;

      // If chasing and target is reached, simulation ends early
      if (state.innings === '2nd' && state.target && simScore >= state.target) {
        break;
      }
    }

    finalScores.push(simScore);
    if (state.innings === '2nd' && state.target && simScore >= state.target) {
      chaseSuccesses++;
    }
  }

  // Sort final scores to get percentiles
  finalScores.sort((a, b) => a - b);
  const avgProjected = Math.round(finalScores.reduce((sum, s) => sum + s, 0) / simCount);
  const p10 = finalScores[Math.floor(simCount * 0.10)];
  const p90 = finalScores[Math.min(finalScores.length - 1, Math.floor(simCount * 0.90))];

  // Calculate Win Probability
  let winProb = 50;
  let rrr: number | null = null;

  if (state.innings === '2nd' && state.target) {
    winProb = Math.round((chaseSuccesses / simCount) * 100);
    const runsRequired = state.target - state.score;
    rrr = ballsRemaining > 0 ? (runsRequired / ballsRemaining) * 6 : 0;
  } else {
    // 1st innings win probability based on projected score compared to historical par at venue
    const venuePar = state.format === 'T20' ? state.venue.avgFirstInningsT20 : state.venue.avgFirstInningsODI;
    const diff = avgProjected - (venuePar * state.venue.multiplier);
    // Logistic mapping: par score gives 50%, +25 runs gives ~75%, -25 runs gives ~25%
    const logit = diff / (state.format === 'T20' ? 30 : 60);
    winProb = Math.round((1 / (1 + Math.exp(-logit))) * 100);
  }

  // Key insights generator
  const insights: string[] = [];
  
  if (state.innings === '1st') {
    const formatLabel = state.format;
    const avgScore = state.format === 'T20' ? state.venue.avgFirstInningsT20 : state.venue.avgFirstInningsODI;
    
    insights.push(`Predicted final score is around ${avgProjected} runs (range: ${p10}-${p90}).`);
    
    if (avgProjected > avgScore + 15) {
      insights.push(`Batting team is on track for an above-par score at ${state.venue.name} (avg: ${avgScore}).`);
    } else if (avgProjected < avgScore - 15) {
      insights.push(`Bowling team is restricting scoring well. Projecting below-par score (avg: ${avgScore}).`);
    } else {
      insights.push(`Score projection is close to the venue average of ${avgScore} runs.`);
    }

    if (state.wickets >= 5) {
      insights.push(`Wickets down (${state.wickets}) is limiting scoring freedom. Expect defensive play.`);
    } else if (state.wickets <= 2 && state.overs >= (state.format === 'T20' ? 14 : 35)) {
      insights.push(`With ${10 - state.wickets} wickets in hand, batting team can launch an aggressive attack in death overs.`);
    }

    if (currentCRR > 8.5 && state.format === 'T20') {
      insights.push(`Healthy scoring rate of ${currentCRR.toFixed(2)} RPO keeps pressure on the bowlers.`);
    }
  } else if (state.innings === '2nd' && state.target && rrr !== null) {
    const runsRequired = state.target - state.score;
    insights.push(`Need ${runsRequired} runs from ${ballsRemaining} balls at ${rrr.toFixed(2)} RPO.`);

    if (winProb > 80) {
      insights.push(`${state.battingTeam.name} is in a highly dominant position to chase this down.`);
    } else if (winProb < 20) {
      insights.push(`${state.bowlingTeam.name} is firmly in control. Chasing team needs a miracle partnership.`);
    } else {
      insights.push(`Match is finely balanced. A boundary or wicket here will shift momentum heavily.`);
    }

    if (rrr > 11 && state.format === 'T20') {
      insights.push(`Required run rate of ${rrr.toFixed(2)} is climbing. High-risk shots will be necessary.`);
    } else if (rrr < 6 && ballsRemaining > 18) {
      insights.push(`Comfortable chase situation. Chasing team can afford to minimize risk and rotate strike.`);
    }

    if (state.wickets >= 7) {
      insights.push(`Only ${10 - state.wickets} wickets remaining. One more wicket could wrap up the tail.`);
    }
  }

  // Risk Level
  let risk: RiskLevel = 'Medium';
  if (state.innings === '1st') {
    if (state.wickets >= 6) risk = 'High';
    else if (state.wickets <= 2) risk = 'Low';
  } else {
    if (rrr !== null) {
      if (rrr > 12 || state.wickets >= 7) risk = 'High';
      else if (rrr < 7 && state.wickets <= 4) risk = 'Low';
    }
  }

  return {
    projectedScore: avgProjected,
    projectedRange: [p10, p90],
    winProbability: winProb,
    keyInsights: insights,
    riskLevel: risk,
    runRateRequired: rrr,
    currentRunRate: currentCRR
  };
}
