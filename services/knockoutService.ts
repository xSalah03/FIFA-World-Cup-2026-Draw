
import { Group, Team, Match } from '../types';

export interface GroupStanding extends Team {
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalsDiff: number;
  status: 'qualified' | 'best-third' | 'eliminated';
}

export interface BracketMatch extends Match {
  nextMatchId?: string;
  round: 'R32' | 'R16' | 'QF' | 'SF' | 'F' | 'B';
}

// Added missing export for SimulationResult to fix build error
export interface SimulationResult {
  groupTables: Record<string, GroupStanding[]>;
  bestThirds: GroupStanding[];
}

/**
 * Simulates a single match between two teams based on their rank and host status.
 * Uses a more sophisticated goal distribution model to ensure realistic GD.
 */
const simulateMatch = (a: Team, b: Team): [number, number, number, number] => {
  // Apply host advantage: Hosts act as if they are ranked better
  const homeBoostA = a.isHost ? 20 : 0;
  const homeBoostB = b.isHost ? 20 : 0;
  const adjRankA = Math.max(1, a.rank - homeBoostA);
  const adjRankB = Math.max(1, b.rank - homeBoostB);
  
  // Calculate relative strength (0 to 1, where 0.5 is equal)
  const strengthA = 1 / (1 + Math.pow(10, (adjRankA - adjRankB) / 250));
  const strengthB = 1 - strengthA;
  const rankDiff = Math.abs(adjRankA - adjRankB);

  // Goal generation logic
  // Average goals in a WC match is ~2.6 (1.3 per team)
  // We use the strength to deviate from this average
  const generateGoals = (strength: number, opponentStrength: number) => {
    // Base goal expectation scales with strength relative to opponent
    const lambda = 1.2 * Math.pow(strength / 0.5, 1.5);
    
    // Simple Poisson-like distribution simulation
    let goals = 0;
    let p = Math.exp(-lambda);
    let r = Math.random();
    let cumulativeP = p;
    
    while (r > cumulativeP && goals < 10) {
      goals++;
      p = (p * lambda) / goals;
      cumulativeP += p;
    }
    return goals;
  };

  let goalsA = generateGoals(strengthA, strengthB);
  let goalsB = generateGoals(strengthB, strengthA);

  // Adjust for extreme cases to maintain realism in a tournament setting
  // (e.g., extremely rare to see 7+ goals unless rank diff is massive)
  if (rankDiff < 40 && (goalsA > 4 || goalsB > 4)) {
    if (goalsA > 4) goalsA = 3 + (goalsA % 2);
    if (goalsB > 4) goalsB = 3 + (goalsB % 2);
  }

  const pointsA = goalsA > goalsB ? 3 : goalsA === goalsB ? 1 : 0;
  const pointsB = goalsB > goalsA ? 3 : goalsB === goalsA ? 1 : 0;

  return [pointsA, pointsB, goalsA, goalsB];
};

// Updated return type to use SimulationResult interface
export const calculateGroupStandings = (groups: Group[]): SimulationResult => {
  const groupTables: Record<string, GroupStanding[]> = {};
  const allThirds: GroupStanding[] = [];

  groups.forEach(group => {
    const standings: Record<string, GroupStanding> = {};
    group.teams.forEach(t => standings[t.id] = { 
      ...t, 
      points: 0, 
      goalsFor: 0, 
      goalsAgainst: 0, 
      goalsDiff: 0, 
      status: 'eliminated' 
    });

    // Each team plays every other team once in the group
    for (let i = 0; i < group.teams.length; i++) {
      for (let j = i + 1; j < group.teams.length; j++) {
        const [pA, pB, gA, gB] = simulateMatch(group.teams[i], group.teams[j]);
        const teamA = standings[group.teams[i].id];
        const teamB = standings[group.teams[j].id];

        teamA.points += pA;
        teamA.goalsFor += gA;
        teamA.goalsAgainst += gB;
        teamA.goalsDiff = teamA.goalsFor - teamA.goalsAgainst;

        teamB.points += pB;
        teamB.goalsFor += gB;
        teamB.goalsAgainst += gA;
        teamB.goalsDiff = teamB.goalsFor - teamB.goalsAgainst;
      }
    }

    // Sort by Points, then GD, then Goals For, then Rank (as final tiebreaker)
    const sorted = Object.values(standings).sort((a, b) => 
      b.points - a.points || 
      b.goalsDiff - a.goalsDiff || 
      b.goalsFor - a.goalsFor || 
      a.rank - b.rank
    );

    // Top 2 always qualify
    sorted.forEach((t, i) => { if (i < 2) t.status = 'qualified'; });
    groupTables[group.id] = sorted;
    allThirds.push(sorted[2]);
  });

  // Calculate best 8 third-place teams out of 12 groups
  const bestThirds = allThirds
    .sort((a, b) => 
      b.points - a.points || 
      b.goalsDiff - a.goalsDiff || 
      b.goalsFor - a.goalsFor || 
      a.rank - b.rank
    )
    .slice(0, 8)
    .map(t => ({ ...t, status: 'best-third' as const }));
  
  // Update status in main tables for visual feedback
  Object.keys(groupTables).forEach(gid => {
    groupTables[gid] = groupTables[gid].map(team => {
      if (bestThirds.some(bt => bt.id === team.id)) return { ...team, status: 'best-third' };
      return team;
    });
  });

  return { groupTables, bestThirds };
};

export const simulateWinner = (home: Team | null, away: Team | null): string | undefined => {
  if (!home || !away) return undefined;
  
  // Knockout matches need a winner. We use a strength-based approach.
  // We simulate a match and if it's a draw, we use rank as a proxy for "penalties"
  const [pA, pB, gA, gB] = simulateMatch(home, away);
  
  if (gA > gB) return home.id;
  if (gB > gA) return away.id;
  
  // Tie-breaker: Weighted coin flip favoring better rank (Penalties simulation)
  const penaltyProbA = 0.5 + ((away.rank - home.rank) / 400);
  const clampedProb = Math.min(0.8, Math.max(0.2, penaltyProbA));
  return Math.random() < clampedProb ? home.id : away.id;
};

// Updated simulatedStandings parameter to use SimulationResult interface
export const generateFullBracket = (
  groups: Group[], 
  overrides: Record<string, string> = {},
  simulatedStandings?: SimulationResult
): BracketMatch[] => {
  const { groupTables, bestThirds } = simulatedStandings || calculateGroupStandings(groups);
  const getPos = (gid: string, pos: number) => groupTables[gid]?.[pos - 1] || null;

  // Official 2026 R32 based on user provided schedule (Matches 73-88)
  const r32: BracketMatch[] = [
    { id: '73', label: 'Match 73', round: 'R32', h: getPos('A', 2), a: getPos('B', 2), nextMatchId: '89' },
    { id: '74', label: 'Match 74', round: 'R32', h: getPos('E', 1), a: bestThirds[0], nextMatchId: '89' },
    { id: '75', label: 'Match 75', round: 'R32', h: getPos('F', 1), a: getPos('C', 2), nextMatchId: '90' },
    { id: '76', label: 'Match 76', round: 'R32', h: getPos('C', 1), a: getPos('F', 2), nextMatchId: '90' },
    { id: '77', label: 'Match 77', round: 'R32', h: getPos('I', 1), a: bestThirds[1], nextMatchId: '91' },
    { id: '78', label: 'Match 78', round: 'R32', h: getPos('E', 2), a: getPos('I', 2), nextMatchId: '91' },
    { id: '79', label: 'Match 79', round: 'R32', h: getPos('A', 1), a: bestThirds[2], nextMatchId: '92' },
    { id: '80', label: 'Match 80', round: 'R32', h: getPos('L', 1), a: bestThirds[3], nextMatchId: '92' },
    { id: '81', label: 'Match 81', round: 'R32', h: getPos('D', 1), a: bestThirds[4], nextMatchId: '93' },
    { id: '82', label: 'Match 82', round: 'R32', h: getPos('G', 1), a: bestThirds[5], nextMatchId: '93' },
    { id: '83', label: 'Match 83', round: 'R32', h: getPos('K', 2), a: getPos('L', 2), nextMatchId: '94' },
    { id: '84', label: 'Match 84', round: 'R32', h: getPos('H', 1), a: getPos('J', 2), nextMatchId: '94' },
    { id: '85', label: 'Match 85', round: 'R32', h: getPos('B', 1), a: bestThirds[6], nextMatchId: '95' },
    { id: '86', label: 'Match 86', round: 'R32', h: getPos('J', 1), a: getPos('H', 2), nextMatchId: '95' },
    { id: '87', label: 'Match 87', round: 'R32', h: getPos('K', 1), a: bestThirds[7], nextMatchId: '96' },
    { id: '88', label: 'Match 88', round: 'R32', h: getPos('D', 2), a: getPos('G', 2), nextMatchId: '96' },
  ].map(m => ({ ...m, home: (m as any).h, away: (m as any).a, winnerId: overrides[m.id] } as BracketMatch));

  const getWinner = (matches: BracketMatch[], id: string) => {
    const m = matches.find(x => x.id === id);
    if (!m || !m.winnerId) return null;
    return m.winnerId === m.home?.id ? m.home : m.away;
  };

  const getLoser = (matches: BracketMatch[], id: string) => {
    const m = matches.find(x => x.id === id);
    if (!m || !m.winnerId) return null;
    return m.winnerId === m.home?.id ? m.away : m.home;
  };

  const r16: BracketMatch[] = [
    { id: '89', label: 'Match 89', round: 'R16', home: getWinner(r32, '73'), away: getWinner(r32, '74'), nextMatchId: '97' },
    { id: '90', label: 'Match 90', round: 'R16', home: getWinner(r32, '75'), away: getWinner(r32, '76'), nextMatchId: '97' },
    { id: '91', label: 'Match 91', round: 'R16', home: getWinner(r32, '77'), away: getWinner(r32, '78'), nextMatchId: '98' },
    { id: '92', label: 'Match 92', round: 'R16', home: getWinner(r32, '79'), away: getWinner(r32, '80'), nextMatchId: '98' },
    { id: '93', label: 'Match 93', round: 'R16', home: getWinner(r32, '81'), away: getWinner(r32, '82'), nextMatchId: '99' },
    { id: '94', label: 'Match 94', round: 'R16', home: getWinner(r32, '83'), away: getWinner(r32, '84'), nextMatchId: '99' },
    { id: '95', label: 'Match 95', round: 'R16', home: getWinner(r32, '85'), away: getWinner(r32, '86'), nextMatchId: '100' },
    { id: '96', label: 'Match 96', round: 'R16', home: getWinner(r32, '87'), away: getWinner(r32, '88'), nextMatchId: '100' },
  ].map(m => ({ ...m, winnerId: overrides[m.id] } as BracketMatch));

  const qf: BracketMatch[] = [
    { id: '97', label: 'QF 1', round: 'QF', home: getWinner(r16, '89'), away: getWinner(r16, '90'), nextMatchId: '101' },
    { id: '98', label: 'QF 2', round: 'QF', home: getWinner(r16, '91'), away: getWinner(r16, '92'), nextMatchId: '101' },
    { id: '99', label: 'QF 3', round: 'QF', home: getWinner(r16, '93'), away: getWinner(r16, '94'), nextMatchId: '102' },
    { id: '100', label: 'QF 4', round: 'QF', home: getWinner(r16, '95'), away: getWinner(r16, '96'), nextMatchId: '102' },
  ].map(m => ({ ...m, winnerId: overrides[m.id] } as BracketMatch));

  const sf: BracketMatch[] = [
    { id: '101', label: 'SF 1', round: 'SF', home: getWinner(qf, '97'), away: getWinner(qf, '98'), nextMatchId: '104' },
    { id: '102', label: 'SF 2', round: 'SF', home: getWinner(qf, '99'), away: getWinner(qf, '100'), nextMatchId: '104' },
  ].map(m => ({ ...m, winnerId: overrides[m.id] } as BracketMatch));

  const bronze: BracketMatch = { 
    id: '103', 
    label: 'Bronze Final', 
    round: 'B', 
    home: getLoser(sf, '101'), 
    away: getLoser(sf, '102'), 
    winnerId: overrides['103'] 
  };

  const final: BracketMatch = { 
    id: '104', 
    label: 'World Final', 
    round: 'F', 
    home: getWinner(sf, '101'), 
    away: getWinner(sf, '102'), 
    winnerId: overrides['104'] 
  };

  return [...r32, ...r16, ...qf, ...sf, bronze, final];
};
