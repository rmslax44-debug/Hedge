export interface Sportsbook {
  key: string;
  name: string;
  shortName: string;
}

export const US_SPORTSBOOKS: Sportsbook[] = [
  { key: 'draftkings', name: 'DraftKings', shortName: 'DK' },
  { key: 'fanduel', name: 'FanDuel', shortName: 'FD' },
  { key: 'betmgm', name: 'BetMGM', shortName: 'MGM' },
  { key: 'caesars', name: 'Caesars', shortName: 'CZR' },
  { key: 'espnbet', name: 'ESPN Bet', shortName: 'ESPN' },
  { key: 'betrivers', name: 'BetRivers', shortName: 'BR' },
  { key: 'pointsbetus', name: 'PointsBet', shortName: 'PB' },
  { key: 'bet365_us', name: 'Bet365', shortName: '365' },
  { key: 'hardrockbet', name: 'Hard Rock Bet', shortName: 'HRB' },
  { key: 'wynnbet', name: 'WynnBET', shortName: 'WYN' },
  { key: 'fliff', name: 'Fliff', shortName: 'FLF' },
  { key: 'betonlineag', name: 'BetOnline', shortName: 'BOL' },
  { key: 'mybookieag', name: 'MyBookie', shortName: 'MB' },
];

export interface Sport {
  key: string;
  name: string;
  emoji: string;
}

export const SPORTS: Sport[] = [
  { key: 'americanfootball_nfl', name: 'NFL', emoji: '🏈' },
  { key: 'basketball_nba', name: 'NBA', emoji: '🏀' },
  { key: 'baseball_mlb', name: 'MLB', emoji: '⚾' },
  { key: 'icehockey_nhl', name: 'NHL', emoji: '🏒' },
  { key: 'americanfootball_ncaaf', name: 'NCAAF', emoji: '🏈' },
  { key: 'basketball_ncaab', name: 'NCAAB', emoji: '🏀' },
  { key: 'mma_mixed_martial_arts', name: 'MMA', emoji: '🥊' },
  { key: 'golf_pga_tour', name: 'Golf', emoji: '⛳' },
  { key: 'soccer_usa_mls', name: 'MLS', emoji: '⚽' },
  { key: 'tennis_atp', name: 'Tennis', emoji: '🎾' },
];
