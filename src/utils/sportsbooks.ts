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
  // American
  { key: 'americanfootball_nfl',           name: 'NFL',             emoji: '🏈' },
  { key: 'basketball_nba',                 name: 'NBA',             emoji: '🏀' },
  { key: 'baseball_mlb',                   name: 'MLB',             emoji: '⚾' },
  { key: 'icehockey_nhl',                  name: 'NHL',             emoji: '🏒' },
  { key: 'americanfootball_ncaaf',         name: 'NCAAF',           emoji: '🏈' },
  { key: 'basketball_ncaab',               name: 'NCAAB',           emoji: '🏀' },
  { key: 'basketball_wnba',               name: 'WNBA',            emoji: '🏀' },
  { key: 'soccer_usa_mls',                 name: 'MLS',             emoji: '⚽' },
  // International soccer
  { key: 'soccer_fifa_world_cup',          name: 'World Cup',       emoji: '🏆' },
  { key: 'soccer_conmebol_copa_america',   name: 'Copa América',    emoji: '🌎' },
  { key: 'soccer_uefa_european_championship', name: 'Euros',        emoji: '🇪🇺' },
  { key: 'soccer_uefa_nations_league',     name: 'Nations League',  emoji: '🌍' },
  { key: 'soccer_concacaf_championship',   name: 'CONCACAF',        emoji: '🌎' },
  { key: 'soccer_afc_asian_cup',           name: 'AFC Asian Cup',   emoji: '🌏' },
  { key: 'soccer_international',           name: 'Intl Friendlies', emoji: '🌐' },
  // European soccer
  { key: 'soccer_epl',                     name: 'Premier League',  emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { key: 'soccer_uefa_champs_league',      name: 'Champions League',emoji: '⭐' },
  { key: 'soccer_spain_la_liga',           name: 'La Liga',         emoji: '🇪🇸' },
  { key: 'soccer_germany_bundesliga',      name: 'Bundesliga',      emoji: '🇩🇪' },
  { key: 'soccer_italy_serie_a',           name: 'Serie A',         emoji: '🇮🇹' },
  { key: 'soccer_france_ligue_one',        name: 'Ligue 1',         emoji: '🇫🇷' },
  { key: 'soccer_uefa_europa_league',      name: 'Europa League',   emoji: '🟠' },
  { key: 'soccer_netherlands_eredivisie',  name: 'Eredivisie',      emoji: '🇳🇱' },
  { key: 'soccer_portugal_primeira_liga',  name: 'Primeira Liga',   emoji: '🇵🇹' },
  { key: 'soccer_england_efl_champ',       name: 'Championship',    emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  // Combat
  { key: 'boxing_boxing',                  name: 'Boxing',          emoji: '🥊' },
  { key: 'mma_mixed_martial_arts',         name: 'MMA',             emoji: '🤼' },
  // Other
  { key: 'golf_pga_tour',                  name: 'Golf',            emoji: '⛳' },
  { key: 'tennis_atp',                     name: 'Tennis',          emoji: '🎾' },
  { key: 'motorsport_nascar_cup_series',   name: 'NASCAR',          emoji: '🏎️' },
];
