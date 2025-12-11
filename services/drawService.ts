
import { Group, Team, Confederation } from '../types';

/**
 * Basic validity check for a single team in a group.
 */
export const isValidPlacement = (team: Team, group: Group): boolean => {
  const currentTeams = group.teams;
  
  // Rule: One team per pot
  if (currentTeams.some(t => t.pot === team.pot)) return false;

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

  currentTeams.forEach((t) => {
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
    // Skip groups that already have a team from this pot
    // (either already in group.teams or assigned in this recursion)
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
 * (doesn't lead to a deadlock for the rest of the pot).
 */
export const findSafeGroupIndex = (
  team: Team,
  allTeamsInPot: Team[],
  currentTeamIndex: number,
  groups: Group[]
): number => {
  const remainingTeamsInPot = allTeamsInPot.slice(currentTeamIndex + 1);
  
  // Shuffle search order to keep draws varied
  const groupIndices = shuffle([...Array(groups.length).keys()]);

  for (const idx of groupIndices) {
    const group = groups[idx];
    
    if (isValidPlacement(team, group)) {
      // Create a set of group indices that are "occupied" for this pot
      // 1. Groups that already have a team from this pot
      const occupied = new Set<number>();
      groups.forEach((g, i) => {
        if (g.teams.some(t => t.pot === team.pot)) {
          occupied.add(i);
        }
      });
      
      // 2. Add the group we are currently testing
      occupied.add(idx);

      // Check if this choice leaves a valid path for the rest
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
