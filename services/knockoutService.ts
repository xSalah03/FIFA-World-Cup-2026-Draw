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
  venue?: string;
  date?: string;
}

export interface SimulationResult {
  groupTables: Record<string, GroupStanding[]>;
  bestThirds: GroupStanding[];
}

/**
 * Simulates a single match between two teams based on their rank and host status.
 */
const simulateMatch = (a: Team, b: Team): [number, number, number, number] => {
  const homeBoostA = a.isHost ? 20 : 0;
  const homeBoostB = b.isHost ? 20 : 0;
  const adjRankA = Math.max(1, a.rank - homeBoostA);
  const adjRankB = Math.max(1, b.rank - homeBoostB);
  
  const strengthA = 1 / (1 + Math.pow(10, (adjRankA - adjRankB) / 250));
  
  const generateGoals = (strength: number) => {
    const lambda = 1.2 * Math.pow(strength / 0.5, 1.5);
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

  let goalsA = generateGoals(strengthA);
  let goalsB = generateGoals(1 - strengthA);

  const pointsA = goalsA > goalsB ? 3 : goalsA === goalsB ? 1 : 0;
  const pointsB = goalsB > goalsA ? 3 : goalsB === goalsA ? 1 : 0;

  return [pointsA, pointsB, goalsA, goalsB];
};

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

    const sorted = Object.values(standings).sort((a, b) => 
      b.points - a.points || 
      b.goalsDiff - a.goalsDiff || 
      b.goalsFor - a.goalsFor || 
      a.rank - b.rank
    );

    sorted.forEach((t, i) => { if (i < 2) t.status = 'qualified'; });
    groupTables[group.id] = sorted;
    allThirds.push(sorted[2]);
  });

  const bestThirds = allThirds
    .sort((a, b) => 
      b.points - a.points || 
      b.goalsDiff - a.goalsDiff || 
      b.goalsFor - a.goalsFor || 
      a.rank - b.rank
    )
    .slice(0, 8)
    .map(t => ({ ...t, status: 'best-third' as const }));
  
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
  const [pA, pB, gA, gB] = simulateMatch(home, away);
  if (gA > gB) return home.id;
  if (gB > gA) return away.id;
  return Math.random() > 0.5 ? home.id : away.id;
};

export const generateFullBracket = (
  groups: Group[], 
  overrides: Record<string, string> = {},
  simulatedStandings?: SimulationResult
): BracketMatch[] => {
  const result = simulatedStandings || calculateGroupStandings(groups);
  const { groupTables, bestThirds } = result;

  const getPos = (gid: string, pos: number) => groupTables[gid]?.[pos - 1] || null;

  /**
   * Official 2026 R32 Pairings (73-88) ordered by BRACKET PATH
   * Sequence: Feed into R16 matches 89, 90, 93, 94 (Half 1) then 91, 92, 95, 96 (Half 2)
   */
  const r32: BracketMatch[] = [
    // Feeds Match 89 (QF 97 Path)
    { id: '74', label: 'Match 74', round: 'R32', home: getPos('E', 1), away: bestThirds[0], nextMatchId: '89', venue: 'Boston Stadium', date: 'Monday, 29 June 2026' },
    { id: '77', label: 'Match 77', round: 'R32', home: getPos('I', 1), away: bestThirds[1], nextMatchId: '89', venue: 'NY/NJ Stadium', date: 'Tuesday, 30 June 2026' },
    // Feeds Match 90 (QF 97 Path)
    { id: '73', label: 'Match 73', round: 'R32', home: getPos('A', 2), away: getPos('B', 2), nextMatchId: '90', venue: 'Los Angeles Stadium', date: 'Sunday, 28 June 2026' },
    { id: '75', label: 'Match 75', round: 'R32', home: getPos('F', 1), away: getPos('C', 2), nextMatchId: '90', venue: 'Estadio Monterrey', date: 'Monday, 29 June 2026' },
    
    // Feeds Match 93 (QF 98 Path)
    { id: '83', label: 'Match 83', round: 'R32', home: getPos('K', 2), away: getPos('L', 2), nextMatchId: '93', venue: 'Toronto Stadium', date: 'Thursday, 2 July 2026' },
    { id: '84', label: 'Match 84', round: 'R32', home: getPos('H', 1), away: getPos('J', 2), nextMatchId: '93', venue: 'Los Angeles Stadium', date: 'Thursday, 2 July 2026' },
    // Feeds Match 94 (QF 98 Path)
    { id: '81', label: 'Match 81', round: 'R32', home: getPos('D', 1), away: bestThirds[4], nextMatchId: '94', venue: 'SF Bay Area Stadium', date: 'Wednesday, 1 July 2026' },
    { id: '82', label: 'Match 82', round: 'R32', home: getPos('G', 1), away: bestThirds[5], nextMatchId: '94', venue: 'Seattle Stadium', date: 'Wednesday, 1 July 2026' },

    // Feeds Match 91 (QF 99 Path)
    { id: '76', label: 'Match 76', round: 'R32', home: getPos('C', 1), away: getPos('F', 2), nextMatchId: '91', venue: 'Houston Stadium', date: 'Monday, 29 June 2026' },
    { id: '78', label: 'Match 78', round: 'R32', home: getPos('E', 2), away: getPos('I', 2), nextMatchId: '91', venue: 'Dallas Stadium', date: 'Tuesday, 30 June 2026' },
    // Feeds Match 92 (QF 99 Path)
    { id: '79', label: 'Match 79', round: 'R32', home: getPos('A', 1), away: bestThirds[2], nextMatchId: '92', venue: 'Mexico City Stadium', date: 'Tuesday, 30 June 2026' },
    { id: '80', label: 'Match 80', round: 'R32', home: getPos('L', 1), away: bestThirds[3], nextMatchId: '92', venue: 'Atlanta Stadium', date: 'Wednesday, 1 July 2026' },

    // Feeds Match 95 (QF 100 Path)
    { id: '86', label: 'Match 86', round: 'R32', home: getPos('J', 1), away: getPos('H', 2), nextMatchId: '95', venue: 'Miami Stadium', date: 'Friday, 3 July 2026' },
    { id: '88', label: 'Match 88', round: 'R32', home: getPos('D', 2), away: getPos('G', 2), nextMatchId: '95', venue: 'Dallas Stadium', date: 'Friday, 3 July 2026' },
    // Feeds Match 96 (QF 100 Path)
    { id: '85', label: 'Match 85', round: 'R32', home: getPos('B', 1), away: bestThirds[6], nextMatchId: '96', venue: 'BC Place Vancouver', date: 'Thursday, 2 July 2026' },
    { id: '87', label: 'Match 87', round: 'R32', home: getPos('K', 1), away: bestThirds[7], nextMatchId: '96', venue: 'Kansas City Stadium', date: 'Friday, 3 July 2026' },
  ].map(m => ({ ...m, winnerId: overrides[m.id] } as BracketMatch));

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

  // Round of 16 (89-96) - Ordered by bracket path
  const r16: BracketMatch[] = [
    { id: '89', label: 'Match 89', round: 'R16', home: getWinner(r32, '74'), away: getWinner(r32, '77'), nextMatchId: '97', venue: 'Philadelphia Stadium', date: 'Saturday, 4 July 2026' },
    { id: '90', label: 'Match 90', round: 'R16', home: getWinner(r32, '73'), away: getWinner(r32, '75'), nextMatchId: '97', venue: 'Houston Stadium', date: 'Saturday, 4 July 2026' },
    { id: '93', label: 'Match 93', round: 'R16', home: getWinner(r32, '83'), away: getWinner(r32, '84'), nextMatchId: '98', venue: 'Dallas Stadium', date: 'Monday, 6 July 2026' },
    { id: '94', label: 'Match 94', round: 'R16', home: getWinner(r32, '81'), away: getWinner(r32, '82'), nextMatchId: '98', venue: 'Seattle Stadium', date: 'Monday, 6 July 2026' },
    { id: '91', label: 'Match 91', round: 'R16', home: getWinner(r32, '76'), away: getWinner(r32, '78'), nextMatchId: '99', venue: 'NY/NJ Stadium', date: 'Sunday, 5 July 2026' },
    { id: '92', label: 'Match 92', round: 'R16', home: getWinner(r32, '79'), away: getWinner(r32, '80'), nextMatchId: '99', venue: 'Mexico City Stadium', date: 'Sunday, 5 July 2026' },
    { id: '95', label: 'Match 95', round: 'R16', home: getWinner(r32, '86'), away: getWinner(r32, '88'), nextMatchId: '100', venue: 'Atlanta Stadium', date: 'Tuesday, 7 July 2026' },
    { id: '96', label: 'Match 96', round: 'R16', home: getWinner(r32, '85'), away: getWinner(r32, '87'), nextMatchId: '100', venue: 'BC Place Vancouver', date: 'Tuesday, 7 July 2026' },
  ].map(m => ({ ...m, winnerId: overrides[m.id] } as BracketMatch));

  // Quarter-Finals (97-100) - Ordered by bracket path
  const qf: BracketMatch[] = [
    { id: '97', label: 'Match 97', round: 'QF', home: getWinner(r16, '89'), away: getWinner(r16, '90'), nextMatchId: '101', venue: 'Boston Stadium', date: 'Thursday, 9 July 2026' },
    { id: '98', label: 'Match 98', round: 'QF', home: getWinner(r16, '93'), away: getWinner(r16, '94'), nextMatchId: '101', venue: 'Los Angeles Stadium', date: 'Friday, 10 July 2026' },
    { id: '99', label: 'Match 99', round: 'QF', home: getWinner(r16, '91'), away: getWinner(r16, '92'), nextMatchId: '102', venue: 'Miami Stadium', date: 'Saturday, 11 July 2026' },
    { id: '100', label: 'Match 100', round: 'QF', home: getWinner(r16, '95'), away: getWinner(r16, '96'), nextMatchId: '102', venue: 'Kansas City Stadium', date: 'Saturday, 11 July 2026' },
  ].map(m => ({ ...m, winnerId: overrides[m.id] } as BracketMatch));

  // Semi-Finals (101-102) - Ordered by bracket path
  const sf: BracketMatch[] = [
    { id: '101', label: 'Match 101', round: 'SF', home: getWinner(qf, '97'), away: getWinner(qf, '98'), nextMatchId: '104', venue: 'Dallas Stadium', date: 'Tuesday, 14 July 2026' },
    { id: '102', label: 'Match 102', round: 'SF', home: getWinner(qf, '99'), away: getWinner(qf, '100'), nextMatchId: '104', venue: 'Atlanta Stadium', date: 'Wednesday, 15 July 2026' },
  ].map(m => ({ ...m, winnerId: overrides[m.id] } as BracketMatch));

  // Bronze Final (103)
  const bronze: BracketMatch = { 
    id: '103', 
    label: 'Match 103', 
    round: 'B', 
    home: getLoser(sf, '101'), 
    away: getLoser(sf, '102'), 
    winnerId: overrides['103'],
    venue: 'Miami Stadium',
    date: 'Saturday, 18 July 2026'
  };

  // World Final (104)
  const final: BracketMatch = { 
    id: '104', 
    label: 'Match 104', 
    round: 'F', 
    home: getWinner(sf, '101'), 
    away: getWinner(sf, '102'), 
    winnerId: overrides['104'],
    venue: 'NY/NJ Stadium',
    date: 'Sunday, 19 July 2026'
  };

  return [...r32, ...r16, ...qf, ...sf, bronze, final];
};
