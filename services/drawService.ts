
import { Group, Team, Confederation } from '../types';

/**
 * Basic validity check for a single team in a group.
 */
export const isValidPlacement = (team: Team, group: Group): boolean => {
  const currentTeams = group.teams;
  
  // Rule: One team per pot
  // If the team is already in the group (e.g. during a swap check), we ignore that specific team
  const otherTeams = currentTeams.filter(t => t.id !== team.id);
  
  if (otherTeams.some(t => t.pot === team.pot)) return false;

  // Rule: FIFA Play-Off Neutrality
  if (team.confederation === Confederation.FIFA) return true;

  const confedCounts: Record<Confederation, number> = {
    [Confederation.UEFA]: 0,
    [Confederation.CONMEBOL]: 0,
    [Confederation.CAF]: 0,
    [Confederation.AFC]: 0,
    [Confederation.CONCACAF]: 0,
    [Confederation.OFC]: 0,
    [Confederation.FIFA]: 0,
  };

  otherTeams.forEach((t) => {
    confedCounts[t.confederation]++;
  });

  const targetConfed = team.confederation;

  if (targetConfed === Confederation.UEFA) {
    // UEFA Exception: Max 2 teams
    return confedCounts[Confederation.UEFA] < 2;
  } else {
    // Same-Confederation Limit: Max 1 team
    return confedCounts[targetConfed] === 0;
  }
};

/**
 * Validates if teamA (from groupA) and teamB (from groupB) can be swapped.
 */
export const isValidSwap = (teamA: Team, groupA: Group, teamB: Team, groupB: Group): boolean => {
  // Must be same pot to maintain group structure
  if (teamA.pot !== teamB.pot) return false;

  // Host locking rules
  if (teamA.isHost) {
    if (teamA.id === 'MEX' && groupB.id !== 'A') return false;
    if (teamA.id === 'CAN' && groupB.id !== 'B') return false;
    if (teamA.id === 'USA' && groupB.id !== 'D') return false;
  }
  if (teamB.isHost) {
    if (teamB.id === 'MEX' && groupA.id !== 'A') return false;
    if (teamB.id === 'CAN' && groupA.id !== 'B') return false;
    if (teamB.id === 'USA' && groupA.id !== 'D') return false;
  }

  // Check if teamA fits in groupB (without teamB)
  const groupBWithoutB = { ...groupB, teams: groupB.teams.filter(t => t.id !== teamB.id) };
  if (!isValidPlacement(teamA, groupBWithoutB)) return false;

  // Check if teamB fits in groupA (without teamA)
  const groupAWithoutA = { ...groupA, teams: groupA.teams.filter(t => t.id !== teamA.id) };
  if (!isValidPlacement(teamB, groupAWithoutA)) return false;

  return true;
};

/**
 * Recursive backtracking solver to check if the remaining teams in a pot
 * can be legally placed in the remaining available groups.
 */
const canCompletePot = (
  remainingTeams: Team[],
  groups: Group[],
  usedGroupIndices: Set<number>
): boolean => {
  if (remainingTeams.length === 0) return true;

  const [currentTeam, ...nextTeams] = remainingTeams;

  for (let i = 0; i < groups.length; i++) {
    if (usedGroupIndices.has(i)) continue;
    
    const group = groups[i];
    
    if (isValidPlacement(currentTeam, group)) {
      usedGroupIndices.add(i);
      if (canCompletePot(nextTeams, groups, usedGroupIndices)) {
        return true;
      }
      usedGroupIndices.delete(i);
    }
  }

  return false;
};

/**
 * Finds a group index that is not only currently valid, but also "safe"
 */
export const findSafeGroupIndex = (
  team: Team,
  allTeamsInPot: Team[],
  currentTeamIndex: number,
  groups: Group[]
): number => {
  const remainingTeamsInPot = allTeamsInPot.slice(currentTeamIndex + 1);
  const groupIndices = shuffle([...Array(groups.length).keys()]);

  for (const idx of groupIndices) {
    const group = groups[idx];
    
    if (isValidPlacement(team, group)) {
      const occupied = new Set<number>();
      groups.forEach((g, i) => {
        if (g.teams.some(t => t.pot === team.pot)) {
          occupied.add(i);
        }
      });
      occupied.add(idx);

      if (canCompletePot(remainingTeamsInPot, groups, occupied)) {
        return idx;
      }
    }
  }

  return -1;
};

export const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};
