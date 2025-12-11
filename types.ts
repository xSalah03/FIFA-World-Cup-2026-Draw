
export enum Confederation {
  UEFA = 'UEFA',
  CONMEBOL = 'CONMEBOL',
  CAF = 'CAF',
  AFC = 'AFC',
  CONCACAF = 'CONCACAF',
  OFC = 'OFC',
  FIFA = 'FIFA' // Used for multi-confederation play-off spots
}

export type Theme = 'light' | 'dark' | 'system';

export interface Team {
  id: string;
  name: string;
  confederation: Confederation;
  rank: number;
  isHost?: boolean;
  pot: number;
  flagCode: string; // ISO 2-letter code
}

export interface Group {
  id: string; // A through L
  name: string;
  teams: Team[]; // Always max 4 teams, one from each pot
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

export interface SavedDraw {
  id: string;
  name: string;
  timestamp: number;
  state: DrawState;
}
