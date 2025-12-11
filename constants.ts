
import { Confederation, Team } from './types';

export const CONFEDERATION_LABELS: Record<Confederation, string> = {
  [Confederation.UEFA]: 'Europe',
  [Confederation.CONMEBOL]: 'South America',
  [Confederation.CAF]: 'Africa',
  [Confederation.AFC]: 'Asia',
  [Confederation.CONCACAF]: 'N. America',
  [Confederation.OFC]: 'Oceania',
};

export const MOCK_TEAMS: Team[] = [
  // Pot 1 (Hosts + Top Seeds)
  { id: 'MEX', name: 'Mexico', confederation: Confederation.CONCACAF, rank: 15, isHost: true, pot: 1, flag: '🇲🇽' },
  { id: 'CAN', name: 'Canada', confederation: Confederation.CONCACAF, rank: 40, isHost: true, pot: 1, flag: '🇨🇦' },
  { id: 'USA', name: 'USA', confederation: Confederation.CONCACAF, rank: 11, isHost: true, pot: 1, flag: '🇺🇸' },
  { id: 'ARG', name: 'Argentina', confederation: Confederation.CONMEBOL, rank: 1, pot: 1, flag: '🇦🇷' },
  { id: 'FRA', name: 'France', confederation: Confederation.UEFA, rank: 2, pot: 1, flag: '🇫🇷' },
  { id: 'ESP', name: 'Spain', confederation: Confederation.UEFA, rank: 3, pot: 1, flag: '🇪🇸' },
  { id: 'ENG', name: 'England', confederation: Confederation.UEFA, rank: 4, pot: 1, flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'BRA', name: 'Brazil', confederation: Confederation.CONMEBOL, rank: 5, pot: 1, flag: '🇧🇷' },
  { id: 'BEL', name: 'Belgium', confederation: Confederation.UEFA, rank: 6, pot: 1, flag: '🇧🇪' },
  { id: 'POR', name: 'Portugal', confederation: Confederation.UEFA, rank: 8, pot: 1, flag: '🇵🇹' },
  { id: 'NED', name: 'Netherlands', confederation: Confederation.UEFA, rank: 7, pot: 1, flag: '🇳🇱' },
  { id: 'ITA', name: 'Italy', confederation: Confederation.UEFA, rank: 10, pot: 1, flag: '🇮🇹' },

  // Pot 2
  { id: 'GER', name: 'Germany', confederation: Confederation.UEFA, rank: 16, pot: 2, flag: '🇩🇪' },
  { id: 'COL', name: 'Colombia', confederation: Confederation.CONMEBOL, rank: 12, pot: 2, flag: '🇨🇴' },
  { id: 'MAR', name: 'Morocco', confederation: Confederation.CAF, rank: 13, pot: 2, flag: '🇲🇦' },
  { id: 'URU', name: 'Uruguay', confederation: Confederation.CONMEBOL, rank: 14, pot: 2, flag: '🇺🇾' },
  { id: 'JPN', name: 'Japan', confederation: Confederation.AFC, rank: 18, pot: 2, flag: '🇯🇵' },
  { id: 'SEN', name: 'Senegal', confederation: Confederation.CAF, rank: 20, pot: 2, flag: '🇸🇳' },
  { id: 'SUI', name: 'Switzerland', confederation: Confederation.UEFA, rank: 19, pot: 2, flag: '🇨🇭' },
  { id: 'IRN', name: 'Iran', confederation: Confederation.AFC, rank: 21, pot: 2, flag: '🇮🇷' },
  { id: 'DEN', name: 'Denmark', confederation: Confederation.UEFA, rank: 22, pot: 2, flag: '🇩🇰' },
  { id: 'KOR', name: 'South Korea', confederation: Confederation.AFC, rank: 23, pot: 2, flag: '🇰🇷' },
  { id: 'AUS', name: 'Australia', confederation: Confederation.AFC, rank: 24, pot: 2, flag: '🇦🇺' },
  { id: 'UKR', name: 'Ukraine', confederation: Confederation.UEFA, rank: 25, pot: 2, flag: '🇺🇦' },

  // Pot 3
  { id: 'AUT', name: 'Austria', confederation: Confederation.UEFA, rank: 26, pot: 3, flag: '🇦🇹' },
  { id: 'ECU', name: 'Ecuador', confederation: Confederation.CONMEBOL, rank: 27, pot: 3, flag: '🇪🇨' },
  { id: 'POL', name: 'Poland', confederation: Confederation.UEFA, rank: 29, pot: 3, flag: '🇵🇱' },
  { id: 'HUN', name: 'Hungary', confederation: Confederation.UEFA, rank: 31, pot: 3, flag: '🇭🇺' },
  { id: 'SRB', name: 'Serbia', confederation: Confederation.UEFA, rank: 32, pot: 3, flag: '🇷🇸' },
  { id: 'TUR', name: 'Turkey', confederation: Confederation.UEFA, rank: 35, pot: 3, flag: '🇹🇷' },
  { id: 'TUN', name: 'Tunisia', confederation: Confederation.CAF, rank: 36, pot: 3, flag: '🇹🇳' },
  { id: 'ALG', name: 'Algeria', confederation: Confederation.CAF, rank: 37, pot: 3, flag: '🇩🇿' },
  { id: 'NGA', name: 'Nigeria', confederation: Confederation.CAF, rank: 39, pot: 3, flag: '🇳🇬' },
  { id: 'EGY', name: 'Egypt', confederation: Confederation.CAF, rank: 33, pot: 3, flag: '🇪🇬' },
  { id: 'QAT', name: 'Qatar', confederation: Confederation.AFC, rank: 34, pot: 3, flag: '🇶🇦' },
  { id: 'PAN', name: 'Panama', confederation: Confederation.CONCACAF, rank: 41, pot: 3, flag: '🇵🇦' },

  // Pot 4
  { id: 'KSA', name: 'Saudi Arabia', confederation: Confederation.AFC, rank: 56, pot: 4, flag: '🇸🇦' },
  { id: 'CMR', name: 'Cameroon', confederation: Confederation.CAF, rank: 49, pot: 4, flag: '🇨🇲' },
  { id: 'MLI', name: 'Mali', confederation: Confederation.CAF, rank: 44, pot: 4, flag: '🇲🇱' },
  { id: 'CRC', name: 'Costa Rica', confederation: Confederation.CONCACAF, rank: 45, pot: 4, flag: '🇨🇷' },
  { id: 'JAM', name: 'Jamaica', confederation: Confederation.CONCACAF, rank: 50, pot: 4, flag: '🇯🇲' },
  { id: 'IRQ', name: 'Iraq', confederation: Confederation.AFC, rank: 58, pot: 4, flag: '🇮🇶' },
  { id: 'UZB', name: 'Uzbekistan', confederation: Confederation.AFC, rank: 60, pot: 4, flag: '🇺🇿' },
  { id: 'PAR', name: 'Paraguay', confederation: Confederation.CONMEBOL, rank: 62, pot: 4, flag: '🇵🇾' },
  { id: 'NZL', name: 'New Zealand', confederation: Confederation.OFC, rank: 94, pot: 4, flag: '🇳🇿' },
  { id: 'RSA', name: 'South Africa', confederation: Confederation.CAF, rank: 59, pot: 4, flag: '🇿🇦' },
  { id: 'UAE', name: 'UAE', confederation: Confederation.AFC, rank: 68, pot: 4, flag: '🇦🇪' },
  { id: 'SOL', name: 'Solomon Islands', confederation: Confederation.OFC, rank: 130, pot: 4, flag: '🇸🇧' },
];

export const GROUP_IDS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
