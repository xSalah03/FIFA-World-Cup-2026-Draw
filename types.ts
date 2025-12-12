
export enum Confederation {
  UEFA = 'UEFA',
  CONMEBOL = 'CONMEBOL',
  CAF = 'CAF',
  AFC = 'AFC',
  CONCACAF = 'CONCACAF',
  OFC = 'OFC',
  FIFA = 'FIFA'
}

export type Theme = 'light' | 'dark' | 'system';
export type AppView = 'draw' | 'knockouts' | 'standings';

export interface Team {
  id: string;
  name: string;
  confederation: Confederation;
  rank: number;
  isHost?: boolean;
  pot: number;
  flagCode: string;
}

export interface Group {
  id: string;
  name: string;
  teams: Team[];
}

export interface Match {
  id: string;
  home: Team | null;
  away: Team | null;
  label: string; // e.g. "Match 49"
  winnerId?: string;
}

export interface DrawHistoryEntry {
  groups: Group[];
  currentPotIndex: number;
  currentTeamIndex: number;
  isComplete: boolean;
  type: 'pick' | 'swap';
  lastTeam?: Team;
  lastGroupId?: string;
}

export interface DrawState {
  pots: Team[][];
  groups: Group[];
  currentPotIndex: number;
  currentTeamIndex: number;
  isDrawing: boolean;
  history: DrawHistoryEntry[];
  isComplete: boolean;
  error?: string;
}

export interface SavedDraw {
  id: string;
  name: string;
  timestamp: number;
  state: DrawState;
  isPreset?: boolean;
}
