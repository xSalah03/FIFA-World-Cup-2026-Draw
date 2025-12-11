
import { Group, Team, Confederation } from '../types';

/**
 * Checks if a team can be placed in a specific group based on FIFA constraints.
 * Rule 1: No group can contain more than one team from the same Confederation, EXCEPT for UEFA.
 * Rule 2: A maximum of two UEFA teams are allowed per group.
 * Rule 3: STRICT POT CONSTRAINT - A group can only have ONE team from each pot.
 */
export const isValidPlacement = (team: Team, group: Group): boolean => {
  const currentTeams = group.teams;
  
  // Rule 3: One team per pot
  if (currentTeams.some(t => t.pot === team.pot)) return false;

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

export const findFirstValidGroupIndex = (team: Team, groups: Group[]): number => {
  // Competitive Balance: Protect quadrants for top seeds in Pot 1
  if (team.pot === 1 && !team.isHost && team.rank <= 4) {
    const preferredGroups: number[] = [];
    if (team.id === 'ARG') preferredGroups.push(4, 5, 6); 
    if (team.id === 'FRA') preferredGroups.push(7, 8);    
    if (team.id === 'ESP') preferredGroups.push(9, 10);   
    if (team.id === 'ENG') preferredGroups.push(11);      
    
    for (const idx of preferredGroups) {
      if (isValidPlacement(team, groups[idx])) return idx;
    }
  }

  for (let i = 0; i < groups.length; i++) {
    if (isValidPlacement(team, groups[i])) {
      return i;
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
