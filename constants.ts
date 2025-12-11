
import { Confederation, Team } from './types';

export const CONFEDERATION_LABELS: Record<Confederation, string> = {
  [Confederation.UEFA]: 'Europe',
  [Confederation.CONMEBOL]: 'South America',
  [Confederation.CAF]: 'Africa',
  [Confederation.AFC]: 'Asia',
  [Confederation.CONCACAF]: 'N. America',
  [Confederation.OFC]: 'Oceania',
  [Confederation.FIFA]: 'Inter-Confed',
};

export const MOCK_TEAMS: Team[] = [
  // Pot 1
  { id: 'CAN', name: 'Canada', confederation: Confederation.CONCACAF, rank: 40, isHost: true, pot: 1, flagCode: 'ca' },
  { id: 'MEX', name: 'Mexico', confederation: Confederation.CONCACAF, rank: 15, isHost: true, pot: 1, flagCode: 'mx' },
  { id: 'USA', name: 'USA', confederation: Confederation.CONCACAF, rank: 11, isHost: true, pot: 1, flagCode: 'us' },
  { id: 'ESP', name: 'Spain', confederation: Confederation.UEFA, rank: 3, pot: 1, flagCode: 'es' },
  { id: 'ARG', name: 'Argentina', confederation: Confederation.CONMEBOL, rank: 1, pot: 1, flagCode: 'ar' },
  { id: 'FRA', name: 'France', confederation: Confederation.UEFA, rank: 2, pot: 1, flagCode: 'fr' },
  { id: 'ENG', name: 'England', confederation: Confederation.UEFA, rank: 4, pot: 1, flagCode: 'gb-eng' },
  { id: 'BRA', name: 'Brazil', confederation: Confederation.CONMEBOL, rank: 5, pot: 1, flagCode: 'br' },
  { id: 'POR', name: 'Portugal', confederation: Confederation.UEFA, rank: 8, pot: 1, flagCode: 'pt' },
  { id: 'NED', name: 'Netherlands', confederation: Confederation.UEFA, rank: 7, pot: 1, flagCode: 'nl' },
  { id: 'BEL', name: 'Belgium', confederation: Confederation.UEFA, rank: 6, pot: 1, flagCode: 'be' },
  { id: 'GER', name: 'Germany', confederation: Confederation.UEFA, rank: 16, pot: 1, flagCode: 'de' },

  // Pot 2
  { id: 'CRO', name: 'Croatia', confederation: Confederation.UEFA, rank: 9, pot: 2, flagCode: 'hr' },
  { id: 'MAR', name: 'Morocco', confederation: Confederation.CAF, rank: 13, pot: 2, flagCode: 'ma' },
  { id: 'COL', name: 'Colombia', confederation: Confederation.CONMEBOL, rank: 12, pot: 2, flagCode: 'co' },
  { id: 'URU', name: 'Uruguay', confederation: Confederation.CONMEBOL, rank: 14, pot: 2, flagCode: 'uy' },
  { id: 'SUI', name: 'Switzerland', confederation: Confederation.UEFA, rank: 19, pot: 2, flagCode: 'ch' },
  { id: 'JPN', name: 'Japan', confederation: Confederation.AFC, rank: 18, pot: 2, flagCode: 'jp' },
  { id: 'SEN', name: 'Senegal', confederation: Confederation.CAF, rank: 20, pot: 2, flagCode: 'sn' },
  { id: 'IRN', name: 'IR Iran', confederation: Confederation.AFC, rank: 21, pot: 2, flagCode: 'ir' },
  { id: 'KOR', name: 'Korea Republic', confederation: Confederation.AFC, rank: 23, pot: 2, flagCode: 'kr' },
  { id: 'ECU', name: 'Ecuador', confederation: Confederation.CONMEBOL, rank: 27, pot: 2, flagCode: 'ec' },
  { id: 'AUT', name: 'Austria', confederation: Confederation.UEFA, rank: 26, pot: 2, flagCode: 'at' },
  { id: 'AUS', name: 'Australia', confederation: Confederation.AFC, rank: 24, pot: 2, flagCode: 'au' },

  // Pot 3
  { id: 'NOR', name: 'Norway', confederation: Confederation.UEFA, rank: 47, pot: 3, flagCode: 'no' },
  { id: 'PAN', name: 'Panama', confederation: Confederation.CONCACAF, rank: 41, pot: 3, flagCode: 'pa' },
  { id: 'EGY', name: 'Egypt', confederation: Confederation.CAF, rank: 33, pot: 3, flagCode: 'eg' },
  { id: 'ALG', name: 'Algeria', confederation: Confederation.CAF, rank: 37, pot: 3, flagCode: 'dz' },
  { id: 'SCO', name: 'Scotland', confederation: Confederation.UEFA, rank: 51, pot: 3, flagCode: 'gb-sct' },
  { id: 'PAR', name: 'Paraguay', confederation: Confederation.CONMEBOL, rank: 62, pot: 3, flagCode: 'py' },
  { id: 'TUN', name: 'Tunisia', confederation: Confederation.CAF, rank: 36, pot: 3, flagCode: 'tn' },
  { id: 'CIV', name: 'Côte d\'Ivoire', confederation: Confederation.CAF, rank: 38, pot: 3, flagCode: 'ci' },
  { id: 'UZB', name: 'Uzbekistan', confederation: Confederation.AFC, rank: 60, pot: 3, flagCode: 'uz' },
  { id: 'QAT', name: 'Qatar', confederation: Confederation.AFC, rank: 34, pot: 3, flagCode: 'qa' },
  { id: 'KSA', name: 'Saudi Arabia', confederation: Confederation.AFC, rank: 56, pot: 3, flagCode: 'sa' },
  { id: 'RSA', name: 'South Africa', confederation: Confederation.CAF, rank: 59, pot: 3, flagCode: 'za' },

  // Pot 4
  { id: 'JOR', name: 'Jordan', confederation: Confederation.AFC, rank: 71, pot: 4, flagCode: 'jo' },
  { id: 'CPV', name: 'Cabo Verde', confederation: Confederation.CAF, rank: 65, pot: 4, flagCode: 'cv' },
  { id: 'GHA', name: 'Ghana', confederation: Confederation.CAF, rank: 64, pot: 4, flagCode: 'gh' },
  { id: 'CUW', name: 'Curaçao', confederation: Confederation.CONCACAF, rank: 86, pot: 4, flagCode: 'cw' },
  { id: 'HAI', name: 'Haiti', confederation: Confederation.CONCACAF, rank: 85, pot: 4, flagCode: 'ht' },
  { id: 'NZL', name: 'New Zealand', confederation: Confederation.OFC, rank: 94, pot: 4, flagCode: 'nz' },
  { id: 'EPOA', name: 'European Play-Off A', confederation: Confederation.UEFA, rank: 99, pot: 4, flagCode: 'eu' },
  { id: 'EPOB', name: 'European Play-Off B', confederation: Confederation.UEFA, rank: 99, pot: 4, flagCode: 'eu' },
  { id: 'EPOC', name: 'European Play-Off C', confederation: Confederation.UEFA, rank: 99, pot: 4, flagCode: 'eu' },
  { id: 'EPOD', name: 'European Play-Off D', confederation: Confederation.UEFA, rank: 99, pot: 4, flagCode: 'eu' },
  { id: 'FPO1', name: 'FIFA Play-Off 1', confederation: Confederation.FIFA, rank: 99, pot: 4, flagCode: 'un' },
  { id: 'FPO2', name: 'FIFA Play-Off 2', confederation: Confederation.FIFA, rank: 99, pot: 4, flagCode: 'un' },
];

export const GROUP_IDS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
