
import { Group, Team, Confederation } from '../types';

/**
 * Checks if a team can be placed in a specific group based on FIFA constraints.
 * Rule 1: No group can contain more than one team from the same Confederation, EXCEPT for UEFA.
 * Rule 2: A maximum of two UEFA teams are allowed per group.
 */
export const isValidPlacement = (team: Team, group: Group): boolean => {
  const currentTeams = group.teams;
  
  // If group is already full (4 teams max in 48-team format for 12 groups)
  if (currentTeams.length >= 4) return false;

  const confedCounts: Record<Confederation, number> = {
    [Confederation.UEFA]: 0,
    [Confederation.CONMEBOL]: 0,
    [Confederation.CAF]: 0,
    [Confederation.AFC]: 0,
    [Confederation.CONCACAF]: 0,
    [Confederation.OFC]: 0,
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
 * Finds the first valid group index for a team.
 * Groups are checked sequentially from A to L.
 */
export const findFirstValidGroupIndex = (team: Team, groups: Group[]): number => {
  for (let i = 0; i < groups.length; i++) {
    if (isValidPlacement(team, groups[i])) {
      return i;
    }
  }
  return -1;
};

/**
 * Utility to shuffle an array (Fisher-Yates)
 */
export const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};
