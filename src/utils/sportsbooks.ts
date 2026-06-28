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

export interface FuturesSport {
  key: string;      // The Odds API outright sport key
  gameKey: string;  // Regular game sport key (for props)
  name: string;
  label: string;    // e.g. "Super Bowl Winner"
  emoji: string;
}

export const FUTURES_SPORTS: FuturesSport[] = [
  { key: 'americanfootball_nfl_super_bowl_winner', gameKey: 'americanfootball_nfl',  name: 'NFL',     label: 'Super Bowl Winner',  emoji: '🏈' },
  { key: 'basketball_nba_championship_winner',     gameKey: 'basketball_nba',         name: 'NBA',     label: 'NBA Champion',       emoji: '🏀' },
  { key: 'baseball_mlb_world_series_winner',       gameKey: 'baseball_mlb',           name: 'MLB',     label: 'World Series',       emoji: '⚾' },
  { key: 'icehockey_nhl_championship_winner',      gameKey: 'icehockey_nhl',          name: 'NHL',     label: 'Stanley Cup',        emoji: '🏒' },
  { key: 'golf_masters_tournament_winner',         gameKey: 'golf_pga_tour',          name: 'Masters', label: 'Masters Winner',     emoji: '⛳' },
  { key: 'mma_mixed_martial_arts',                 gameKey: 'mma_mixed_martial_arts', name: 'MMA',     label: 'Title Fight',        emoji: '🤼' },
];

export const PROP_MARKETS: Record<string, { key: string; label: string }[]> = {
  americanfootball_nfl: [
    { key: 'player_pass_yards',       label: 'Pass Yards' },
    { key: 'player_pass_tds',         label: 'Pass TDs' },
    { key: 'player_rush_yards',       label: 'Rush Yards' },
    { key: 'player_receiving_yards',  label: 'Rec Yards' },
    { key: 'player_receptions',       label: 'Receptions' },
    { key: 'player_anytime_td',       label: 'Anytime TD' },
  ],
  americanfootball_ncaaf: [
    { key: 'player_pass_yards',      label: 'Pass Yards' },
    { key: 'player_rush_yards',      label: 'Rush Yards' },
    { key: 'player_receiving_yards', label: 'Rec Yards' },
  ],
  basketball_nba: [
    { key: 'player_points',   label: 'Points' },
    { key: 'player_rebounds', label: 'Rebounds' },
    { key: 'player_assists',  label: 'Assists' },
    { key: 'player_threes',   label: '3-Pointers' },
    { key: 'player_blocks',   label: 'Blocks' },
    { key: 'player_steals',   label: 'Steals' },
  ],
  basketball_ncaab: [
    { key: 'player_points',   label: 'Points' },
    { key: 'player_rebounds', label: 'Rebounds' },
    { key: 'player_assists',  label: 'Assists' },
  ],
  baseball_mlb: [
    { key: 'player_strikeouts',   label: 'Strikeouts (P)' },
    { key: 'player_hits',         label: 'Hits' },
    { key: 'player_home_runs',    label: 'Home Runs' },
    { key: 'player_rbi',          label: 'RBIs' },
    { key: 'player_total_bases',  label: 'Total Bases' },
  ],
  icehockey_nhl: [
    { key: 'player_points',         label: 'Points' },
    { key: 'player_goals',          label: 'Goals' },
    { key: 'player_assists',        label: 'Assists' },
    { key: 'player_shots_on_goal',  label: 'Shots on Goal' },
  ],
};

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
