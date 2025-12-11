
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
  round: 'R32' | 'R16' | 'QF' | 'SF' | 'F' | '3RD';
}

/**
 * Simulates a single match between two teams based on their rank.
 * Incorporates home advantage for host nations and Elo-style probability.
 * Returns [pointsA, pointsB, goalsA, goalsB]
 */
const simulateMatch = (a: Team, b: Team): [number, number, number, number] => {
  // Home advantage factor: effectively boosts rank by 25 points for host nations
  const homeBoostA = a.isHost ? 25 : 0;
  const homeBoostB = b.isHost ? 25 : 0;
  
  // Adjusted ranks for simulation (lower is better, min rank 1)
  const adjRankA = Math.max(1, a.rank - homeBoostA);
  const adjRankB = Math.max(1, b.rank - homeBoostB);

  // Win probability using a sigmoid/logistic curve based on rank differential
  // Scaling factor 100 means a 100-rank gap results in roughly 90% win prob for the favorite
  const winProbA = 1 / (1 + Math.pow(10, (adjRankA - adjRankB) / 100));
  
  // In group stage, draws are likely. Draw prob is higher when teams are closely ranked.
  const rankDiff = Math.abs(adjRankA - adjRankB);
  // Base draw probability of 28%, decaying as the strength gap increases
  const drawProb = 0.28 * Math.exp(-rankDiff / 150);
  
  const roll = Math.random();
  
  let result: 'A' | 'B' | 'D';
  if (roll < winProbA * (1 - drawProb)) {
    result = 'A';
  } else if (roll < (winProbA * (1 - drawProb)) + drawProb) {
    result = 'D';
  } else {
    result = 'B';
  }

  // Goal simulation based on match result to ensure consistency
  let goalsA = 0;
  let goalsB = 0;

  if (result === 'A') {
    // Favorite/Team A wins: Goals A > Goals B
    goalsB = Math.floor(Math.random() * 2); // 0 or 1
    // Generate a gap, usually 1 or 2 goals, occasionally more for big rank gaps
    const gap = 1 + (rankDiff > 50 && Math.random() > 0.6 ? 1 : 0) + (Math.random() > 0.9 ? 1 : 0);
    goalsA = goalsB + gap;
  } else if (result === 'B') {
    // Underdog/Team B wins: Goals B > Goals A
    goalsA = Math.floor(Math.random() * 2);
    const gap = 1 + (rankDiff > 50 && Math.random() * 0.8 > 0.4 ? 1 : 0); 
    goalsB = goalsA + gap;
  } else {
    // Draw: Goals A == Goals B
    const drawRoll = Math.random();
    const drawScore = drawRoll < 0.3 ? 0 : drawRoll < 0.8 ? 1 : 2;
    goalsA = drawScore;
    goalsB = drawScore;
  }

  const ptsA = result === 'A' ? 3 : result === 'D' ? 1 : 0;
  const ptsB = result === 'B' ? 3 : result === 'D' ? 1 : 0;

  return [ptsA, ptsB, goalsA, goalsB];
};

/**
 * Simulates group stage performance by running a round-robin for each group.
 */
export const calculateGroupStandings = (groups: Group[]): { 
  groupTables: Record<string, GroupStanding[]>,
  bestThirds: GroupStanding[]
} => {
  const groupTables: Record<string, GroupStanding[]> = {};
  const allThirds: GroupStanding[] = [];

  groups.forEach(group => {
    const standingsMap: Record<string, GroupStanding> = {};
    group.teams.forEach(t => {
      standingsMap[t.id] = {
        ...t,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalsDiff: 0,
        status: 'eliminated'
      };
    });

    // Round Robin Simulation
    for (let i = 0; i < group.teams.length; i++) {
      for (let j = i + 1; j < group.teams.length; j++) {
        const teamA = group.teams[i];
        const teamB = group.teams[j];
        
        const [ptsA, ptsB, gA, gB] = simulateMatch(teamA, teamB);
        
        const sA = standingsMap[teamA.id];
        const sB = standingsMap[teamB.id];
        
        sA.points += ptsA;
        sA.goalsFor += gA;
        sA.goalsAgainst += gB;
        sA.goalsDiff = sA.goalsFor - sA.goalsAgainst;

        sB.points += ptsB;
        sB.goalsFor += gB;
        sB.goalsAgainst += gA;
        sB.goalsDiff = sB.goalsFor - sB.goalsAgainst;
      }
    }

    // Tie-breaker Sort: Points -> GD -> GF -> Original Rank
    const sortedStandings = Object.values(standingsMap).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalsDiff !== a.goalsDiff) return b.goalsDiff - a.goalsDiff;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.rank - b.rank;
    });

    // Mark qualification status
    sortedStandings[0].status = 'qualified';
    sortedStandings[1].status = 'qualified';
    
    groupTables[group.id] = sortedStandings;
    allThirds.push(sortedStandings[2]);
  });

  // Calculate the 8 best 3rd place teams from the 12 groups
  const sortedThirds = [...allThirds].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalsDiff !== a.goalsDiff) return b.goalsDiff - a.goalsDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.rank - b.rank;
  });

  const bestThirds = sortedThirds.slice(0, 8).map(t => ({ ...t, status: 'best-third' as const }));

  // Update original tables with correct status
  Object.keys(groupTables).forEach(gid => {
    groupTables[gid] = groupTables[gid].map(team => {
      if (bestThirds.find(bt => bt.id === team.id)) return { ...team, status: 'best-third' };
      return team;
    });
  });

  return { groupTables, bestThirds };
};

/**
 * Simulates a winner for knockout matches (no draws allowed).
 * Uses rank differential and home advantage logic.
 */
export const simulateWinner = (home: Team | null, away: Team | null): string | undefined => {
  if (!home || !away) return undefined;
  
  const homeBoost = home.isHost ? 25 : 0;
  const awayBoost = away.isHost ? 25 : 0;
  
  const adjRankHome = Math.max(1, home.rank - homeBoost);
  const adjRankAway = Math.max(1, away.rank - awayBoost);

  // Win probability for 'home' team (logistic curve)
  const winProbHome = 1 / (1 + Math.pow(10, (adjRankHome - adjRankAway) / 100));
  
  return Math.random() < winProbHome ? home.id : away.id;
};

/**
 * Generates the full bracket based on group results and user overrides.
 * Ensures each of the 32 slots (12 Winners, 12 Runners-up, 8 Best 3rds) is used exactly once.
 */
export const generateFullBracket = (
  groups: Group[], 
  overrides: Record<string, string> = {},
  simulatedStandings?: { groupTables: Record<string, GroupStanding[]>, bestThirds: GroupStanding[] }
): BracketMatch[] => {
  const { groupTables, bestThirds } = simulatedStandings || calculateGroupStandings(groups);
  
  const getPos = (groupId: string, pos: number) => {
    const table = groupTables[groupId];
    if (!table || !table[pos - 1]) return null;
    return table[pos - 1];
  };

  const getWinner = (matches: BracketMatch[], id: string) => {
    const m = matches.find(x => x.id === id);
    if (!m || !m.winnerId) return null;
    return m.winnerId === m.home?.id ? m.home : m.away;
  };

  const getLoser = (matches: BracketMatch[], id: string) => {
    const m = matches.find(x => x.id === id);
    if (!m || !m.winnerId || !m.home || !m.away) return null;
    return m.winnerId === m.home.id ? m.away : m.home;
  };

  // Round of 32 Pairing Logic (Corrected 48-team unique distribution)
  const r32Matches: BracketMatch[] = [
    { id: '49', label: 'Match 49', round: 'R32', h: getPos('A', 1), a: getPos('C', 2), nextMatchId: '65' },
    { id: '50', label: 'Match 50', round: 'R32', h: getPos('B', 1), a: bestThirds[0], nextMatchId: '65' },
    { id: '51', label: 'Match 51', round: 'R32', h: getPos('C', 1), a: getPos('A', 2), nextMatchId: '66' },
    { id: '52', label: 'Match 52', round: 'R32', h: getPos('D', 1), a: bestThirds[1], nextMatchId: '66' },
    { id: '53', label: 'Match 53', round: 'R32', h: getPos('E', 1), a: getPos('G', 2), nextMatchId: '67' },
    { id: '54', label: 'Match 54', round: 'R32', h: getPos('F', 1), a: bestThirds[2], nextMatchId: '67' },
    { id: '55', label: 'Match 55', round: 'R32', h: getPos('G', 1), a: getPos('E', 2), nextMatchId: '68' },
    { id: '56', label: 'Match 56', round: 'R32', h: getPos('H', 1), a: bestThirds[3], nextMatchId: '68' },
    { id: '57', label: 'Match 57', round: 'R32', h: getPos('I', 1), a: getPos('K', 2), nextMatchId: '69' },
    { id: '58', label: 'Match 58', round: 'R32', h: getPos('J', 1), a: bestThirds[4], nextMatchId: '69' },
    { id: '59', label: 'Match 59', round: 'R32', h: getPos('K', 1), a: getPos('I', 2), nextMatchId: '70' },
    { id: '60', label: 'Match 60', round: 'R32', h: getPos('L', 1), a: bestThirds[5], nextMatchId: '70' },
    { id: '61', label: 'Match 61', round: 'R32', h: getPos('B', 2), a: getPos('F', 2), nextMatchId: '71' },
    { id: '62', label: 'Match 62', round: 'R32', h: bestThirds[6], a: getPos('J', 2), nextMatchId: '71' },
    { id: '63', label: 'Match 63', round: 'R32', h: getPos('D', 2), a: getPos('H', 2), nextMatchId: '72' },
    { id: '64', label: 'Match 64', round: 'R32', h: bestThirds[7], a: getPos('L', 2), nextMatchId: '72' },
  ].map(m => {
    return { ...m, home: (m as any).h, away: (m as any).a, winnerId: overrides[m.id] } as BracketMatch;
  });

  // Round of 16
  const r16Matches: BracketMatch[] = [
    { id: '65', label: 'Match 65', round: 'R16', home: getWinner(r32Matches, '49'), away: getWinner(r32Matches, '50'), nextMatchId: '73' },
    { id: '66', label: 'Match 66', round: 'R16', home: getWinner(r32Matches, '51'), away: getWinner(r32Matches, '52'), nextMatchId: '73' },
    { id: '67', label: 'Match 67', round: 'R16', home: getWinner(r32Matches, '53'), away: getWinner(r32Matches, '54'), nextMatchId: '74' },
    { id: '68', label: 'Match 68', round: 'R16', home: getWinner(r32Matches, '55'), away: getWinner(r32Matches, '56'), nextMatchId: '74' },
    { id: '69', label: 'Match 69', round: 'R16', home: getWinner(r32Matches, '57'), away: getWinner(r32Matches, '58'), nextMatchId: '75' },
    { id: '70', label: 'Match 70', round: 'R16', home: getWinner(r32Matches, '59'), away: getWinner(r32Matches, '60'), nextMatchId: '75' },
    { id: '71', label: 'Match 71', round: 'R16', home: getWinner(r32Matches, '61'), away: getWinner(r32Matches, '62'), nextMatchId: '76' },
    { id: '72', label: 'Match 72', round: 'R16', home: getWinner(r32Matches, '63'), away: getWinner(r32Matches, '64'), nextMatchId: '76' },
  ].map(m => ({ ...m, winnerId: overrides[m.id] } as BracketMatch));

  // Quarter Finals
  const qfMatches: BracketMatch[] = [
    { id: '73', label: 'QF 1', round: 'QF', home: getWinner(r16Matches, '65'), away: getWinner(r16Matches, '66'), nextMatchId: '77' },
    { id: '74', label: 'QF 2', round: 'QF', home: getWinner(r16Matches, '67'), away: getWinner(r16Matches, '68'), nextMatchId: '77' },
    { id: '75', label: 'QF 3', round: 'QF', home: getWinner(r16Matches, '69'), away: getWinner(r16Matches, '70'), nextMatchId: '78' },
    { id: '76', label: 'QF 4', round: 'QF', home: getWinner(r16Matches, '71'), away: getWinner(r16Matches, '72'), nextMatchId: '78' },
  ].map(m => ({ ...m, winnerId: overrides[m.id] } as BracketMatch));

  // Semi Finals
  const sfMatches: BracketMatch[] = [
    { id: '77', label: 'SF 1', round: 'SF', home: getWinner(qfMatches, '73'), away: getWinner(qfMatches, '74'), nextMatchId: '79' },
    { id: '78', label: 'SF 2', round: 'SF', home: getWinner(qfMatches, '75'), away: getWinner(qfMatches, '76'), nextMatchId: '79' },
  ].map(m => ({ ...m, winnerId: overrides[m.id] } as BracketMatch));

  // Grand Final
  const fMatch: BracketMatch = {
    id: '79',
    label: 'Grand Final',
    round: 'F',
    home: getWinner(sfMatches, '77'),
    away: getWinner(sfMatches, '78'),
    winnerId: overrides['79']
  } as BracketMatch;

  // 3rd Place Play-off
  const tMatch: BracketMatch = {
    id: '80',
    label: '3rd Place Match',
    round: '3RD',
    home: getLoser(sfMatches, '77'),
    away: getLoser(sfMatches, '78'),
    winnerId: overrides['80']
  } as BracketMatch;

  return [...r32Matches, ...r16Matches, ...qfMatches, ...sfMatches, fMatch, tMatch];
};
