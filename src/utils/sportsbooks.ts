export interface Sportsbook {
  key: string;
  name: string;
  shortName: string;
  url: string;
}

export const US_SPORTSBOOKS: Sportsbook[] = [
  { key: 'draftkings',    name: 'DraftKings',    shortName: 'DK',   url: 'https://sportsbook.draftkings.com' },
  { key: 'fanduel',       name: 'FanDuel',       shortName: 'FD',   url: 'https://sportsbook.fanduel.com' },
  { key: 'betmgm',        name: 'BetMGM',        shortName: 'MGM',  url: 'https://sports.betmgm.com' },
  { key: 'caesars',       name: 'Caesars',       shortName: 'CZR',  url: 'https://sportsbook.caesars.com' },
  { key: 'espnbet',       name: 'ESPN Bet',      shortName: 'ESPN', url: 'https://espnbet.com' },
  { key: 'betrivers',     name: 'BetRivers',     shortName: 'BR',   url: 'https://www.betrivers.com' },
  { key: 'pointsbetus',   name: 'PointsBet',     shortName: 'PB',   url: 'https://us.pointsbet.com' },
  { key: 'bet365_us',     name: 'Bet365',        shortName: '365',  url: 'https://www.bet365.com' },
  { key: 'hardrockbet',   name: 'Hard Rock Bet', shortName: 'HRB',  url: 'https://hardrockbet.com' },
  { key: 'wynnbet',       name: 'WynnBET',       shortName: 'WYN',  url: 'https://www.wynnbet.com' },
  { key: 'fliff',         name: 'Fliff',         shortName: 'FLF',  url: 'https://app.getfliff.com' },
  { key: 'betonlineag',   name: 'BetOnline',     shortName: 'BOL',  url: 'https://www.betonline.ag' },
  { key: 'mybookieag',    name: 'MyBookie',      shortName: 'MB',   url: 'https://www.mybookie.ag' },
];

export interface Sport {
  key: string;
  name: string;
  emoji: string;
}

export const SPORTS: Sport[] = [
  { key: 'americanfootball_nfl',   name: 'NFL',    emoji: '🏈' },
  { key: 'basketball_nba',         name: 'NBA',    emoji: '🏀' },
  { key: 'baseball_mlb',           name: 'MLB',    emoji: '⚾' },
  { key: 'icehockey_nhl',          name: 'NHL',    emoji: '🏒' },
  { key: 'americanfootball_ncaaf', name: 'NCAAF',  emoji: '🏈' },
  { key: 'basketball_ncaab',       name: 'NCAAB',  emoji: '🏀' },
  { key: 'mma_mixed_martial_arts', name: 'MMA',    emoji: '🥊' },
  { key: 'golf_pga_tour',          name: 'Golf',   emoji: '⛳' },
  { key: 'soccer_usa_mls',         name: 'MLS',    emoji: '⚽' },
  { key: 'tennis_atp',             name: 'Tennis', emoji: '🎾' },
];
