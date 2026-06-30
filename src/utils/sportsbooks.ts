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
  key: string;
  gameKey: string;
  name: string;
  label: string;
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
  // US Sports
  { key: 'americanfootball_nfl',                 name: 'NFL',               emoji: '🏈' },
  { key: 'basketball_nba',                       name: 'NBA',               emoji: '🏀' },
  { key: 'baseball_mlb',                         name: 'MLB',               emoji: '⚾' },
  { key: 'icehockey_nhl',                        name: 'NHL',               emoji: '🏒' },
  { key: 'americanfootball_ncaaf',               name: 'NCAAF',             emoji: '🏈' },
  { key: 'basketball_ncaab',                     name: 'NCAAB',             emoji: '🏀' },
  { key: 'basketball_wnba',                      name: 'WNBA',              emoji: '🏀' },
  { key: 'soccer_usa_mls',                       name: 'MLS',               emoji: '⚽' },
  { key: 'soccer_usa_nwsl',                      name: 'NWSL',              emoji: '⚽' },
  { key: 'americanfootball_cfl',                 name: 'CFL',               emoji: '🏈' },
  // European Soccer — Top Leagues
  { key: 'soccer_epl',                           name: 'Premier League',    emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { key: 'soccer_england_efl_champ',             name: 'Championship',      emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { key: 'soccer_england_league1',               name: 'EFL League One',    emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { key: 'soccer_spain_la_liga',                 name: 'La Liga',           emoji: '🇪🇸' },
  { key: 'soccer_spain_segunda_division',        name: 'La Liga 2',         emoji: '🇪🇸' },
  { key: 'soccer_germany_bundesliga',            name: 'Bundesliga',        emoji: '🇩🇪' },
  { key: 'soccer_germany_bundesliga2',           name: 'Bundesliga 2',      emoji: '🇩🇪' },
  { key: 'soccer_italy_serie_a',                 name: 'Serie A',           emoji: '🇮🇹' },
  { key: 'soccer_italy_serie_b',                 name: 'Serie B',           emoji: '🇮🇹' },
  { key: 'soccer_france_ligue_one',              name: 'Ligue 1',           emoji: '🇫🇷' },
  { key: 'soccer_france_ligue_two',              name: 'Ligue 2',           emoji: '🇫🇷' },
  { key: 'soccer_netherlands_eredivisie',        name: 'Eredivisie',        emoji: '🇳🇱' },
  { key: 'soccer_portugal_primeira_liga',        name: 'Primeira Liga',     emoji: '🇵🇹' },
  { key: 'soccer_belgium_first_div',             name: 'Belgian Pro League',emoji: '🇧🇪' },
  { key: 'soccer_turkey_super_league',           name: 'Süper Lig',         emoji: '🇹🇷' },
  { key: 'soccer_scotland_premiership',          name: 'Scottish Prem.',    emoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  // European Cups & Competitions
  { key: 'soccer_uefa_champs_league',            name: 'Champions League',  emoji: '⭐' },
  { key: 'soccer_uefa_europa_league',            name: 'Europa League',     emoji: '🟠' },
  { key: 'soccer_uefa_europa_conference_league', name: 'Conference League', emoji: '🟢' },
  { key: 'soccer_uefa_nations_league',           name: 'Nations League',    emoji: '🌍' },
  { key: 'soccer_uefa_european_championship',    name: 'Euros',             emoji: '🇪🇺' },
  // International Soccer
  { key: 'soccer_fifa_world_cup',                name: 'World Cup',         emoji: '🏆' },
  { key: 'soccer_conmebol_copa_america',         name: 'Copa América',      emoji: '🌎' },
  { key: 'soccer_concacaf_championship',         name: 'CONCACAF Champ.',   emoji: '🌎' },
  { key: 'soccer_concacaf_gold_cup',             name: 'Gold Cup',          emoji: '🏆' },
  { key: 'soccer_afc_asian_cup',                 name: 'AFC Asian Cup',     emoji: '🌏' },
  { key: 'soccer_international',                 name: 'Intl Friendlies',   emoji: '🌐' },
  // Americas & Pacific Soccer
  { key: 'soccer_copa_libertadores',             name: 'Copa Libertadores', emoji: '🌎' },
  { key: 'soccer_copa_sudamericana',             name: 'Copa Sudamericana', emoji: '🌎' },
  { key: 'soccer_brazil_campeonato',             name: 'Brasileirão',       emoji: '🇧🇷' },
  { key: 'soccer_argentina_primera_division',    name: 'Argentine Primera', emoji: '🇦🇷' },
  { key: 'soccer_mexico_ligamx',                 name: 'Liga MX',           emoji: '🇲🇽' },
  { key: 'soccer_australia_aleague',             name: 'A-League',          emoji: '🦘' },
  // Combat Sports
  { key: 'boxing_boxing',                        name: 'Boxing',            emoji: '🥊' },
  { key: 'mma_mixed_martial_arts',               name: 'MMA',               emoji: '🤼' },
  // Golf & Tennis
  { key: 'golf_pga_tour',                        name: 'Golf (PGA)',        emoji: '⛳' },
  { key: 'golf_european_tour',                   name: 'DP World Tour',     emoji: '⛳' },
  { key: 'tennis_atp',                           name: 'Tennis (ATP)',      emoji: '🎾' },
  { key: 'tennis_wta',                           name: 'Tennis (WTA)',      emoji: '🎾' },
  // Motor Sports
  { key: 'motorsport_nascar_cup_series',         name: 'NASCAR',            emoji: '🏎️' },
  { key: 'motorsport_formula_1',                 name: 'Formula 1',         emoji: '🏎️' },
  // Other Sports
  { key: 'basketball_euroleague',                name: 'EuroLeague',        emoji: '🏀' },
  { key: 'aussierules_afl',                      name: 'AFL',               emoji: '🏉' },
  { key: 'rugbyleague_nrl',                      name: 'NRL',               emoji: '🏉' },
  { key: 'cricket_ipl',                          name: 'IPL Cricket',       emoji: '🏏' },
];

export const SPORT_GROUPS: { label: string; keys: string[] }[] = [
  {
    label: '🇺🇸 US Sports',
    keys: [
      'americanfootball_nfl', 'basketball_nba', 'baseball_mlb', 'icehockey_nhl',
      'americanfootball_ncaaf', 'basketball_ncaab', 'basketball_wnba',
      'soccer_usa_mls', 'soccer_usa_nwsl', 'americanfootball_cfl',
    ],
  },
  {
    label: '⚽ European Leagues',
    keys: [
      'soccer_epl', 'soccer_england_efl_champ', 'soccer_england_league1',
      'soccer_spain_la_liga', 'soccer_spain_segunda_division',
      'soccer_germany_bundesliga', 'soccer_germany_bundesliga2',
      'soccer_italy_serie_a', 'soccer_italy_serie_b',
      'soccer_france_ligue_one', 'soccer_france_ligue_two',
      'soccer_netherlands_eredivisie', 'soccer_portugal_primeira_liga',
      'soccer_belgium_first_div', 'soccer_turkey_super_league', 'soccer_scotland_premiership',
    ],
  },
  {
    label: '🏆 European Cups',
    keys: [
      'soccer_uefa_champs_league', 'soccer_uefa_europa_league',
      'soccer_uefa_europa_conference_league', 'soccer_uefa_nations_league',
      'soccer_uefa_european_championship',
    ],
  },
  {
    label: '🌍 International Soccer',
    keys: [
      'soccer_fifa_world_cup', 'soccer_conmebol_copa_america',
      'soccer_concacaf_championship', 'soccer_concacaf_gold_cup',
      'soccer_afc_asian_cup', 'soccer_international',
    ],
  },
  {
    label: '🌎 Americas & Pacific',
    keys: [
      'soccer_copa_libertadores', 'soccer_copa_sudamericana',
      'soccer_brazil_campeonato', 'soccer_argentina_primera_division',
      'soccer_mexico_ligamx', 'soccer_australia_aleague',
    ],
  },
  {
    label: '🥊 Combat Sports',
    keys: ['boxing_boxing', 'mma_mixed_martial_arts'],
  },
  {
    label: '⛳ Golf & Tennis',
    keys: ['golf_pga_tour', 'golf_european_tour', 'tennis_atp', 'tennis_wta'],
  },
  {
    label: '🏎️ Motor Sports',
    keys: ['motorsport_nascar_cup_series', 'motorsport_formula_1'],
  },
  {
    label: '🏉 Other Sports',
    keys: ['basketball_euroleague', 'aussierules_afl', 'rugbyleague_nrl', 'cricket_ipl'],
  },
];
