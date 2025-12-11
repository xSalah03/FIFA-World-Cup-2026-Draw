
export enum Confederation {
  UEFA = 'UEFA',
  CONMEBOL = 'CONMEBOL',
  CAF = 'CAF',
  AFC = 'AFC',
  CONCACAF = 'CONCACAF',
  OFC = 'OFC'
}

export interface Team {
  id: string;
  name: string;
  confederation: Confederation;
  rank: number;
  isHost?: boolean;
  pot: number;
  flag: string;
}

export interface Group {
  id: string; // A through L
  name: string;
  teams: Team[];
}

export interface DrawState {
  pots: Team[][];
  groups: Group[];
  currentPotIndex: number;
  currentTeamIndex: number;
  isDrawing: boolean;
  history: { team: Team; groupId: string }[];
  isComplete: boolean;
  error?: string;
}
