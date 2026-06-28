const BASE = 'https://api.the-odds-api.com/v4';

export interface OddsOutcome {
  name: string;
  price: number; // American odds integer
  description?: string; // "Over" | "Under" for player props
  point?: number; // line value for player props
}

export interface OddsMarket {
  key: string;
  outcomes: OddsOutcome[];
}

export interface OddsBookmaker {
  key: string;
  title: string;
  markets: OddsMarket[];
}

export interface OddsEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsBookmaker[];
}

export interface BestOdds {
  bookKey: string;
  bookName: string;
  price: number; // American
}

export function findBestOddsForTeam(
  event: OddsEvent,
  teamName: string,
  userBookKeys: string[],
): BestOdds | null {
  let best: BestOdds | null = null;
  let bestDecimal = 0;

  for (const bm of event.bookmakers) {
    if (!userBookKeys.includes(bm.key)) continue;
    const h2h = bm.markets.find((m) => m.key === 'h2h');
    if (!h2h) continue;
    const outcome = h2h.outcomes.find((o) => o.name === teamName);
    if (!outcome) continue;

    const dec =
      outcome.price > 0 ? outcome.price / 100 + 1 : 100 / Math.abs(outcome.price) + 1;

    if (dec > bestDecimal) {
      bestDecimal = dec;
      best = { bookKey: bm.key, bookName: bm.title, price: outcome.price };
    }
  }

  return best;
}

export function getOddsForTeamAtBook(
  event: OddsEvent,
  teamName: string,
  bookKey: string,
): number | null {
  const bm = event.bookmakers.find((b) => b.key === bookKey);
  if (!bm) return null;
  const h2h = bm.markets.find((m) => m.key === 'h2h');
  if (!h2h) return null;
  return h2h.outcomes.find((o) => o.name === teamName)?.price ?? null;
}

export async function fetchOdds(
  sport: string,
  apiKey: string,
  bookmakerKeys: string[],
): Promise<OddsEvent[]> {
  if (!apiKey) throw new Error('No API key set');
  if (bookmakerKeys.length === 0) throw new Error('No sportsbooks selected');

  const params = new URLSearchParams({
    apiKey,
    regions: 'us',
    markets: 'h2h',
    oddsFormat: 'american',
    bookmakers: bookmakerKeys.join(','),
  });

  const res = await fetch(`${BASE}/sports/${sport}/odds?${params}`);

  if (res.status === 401) throw new Error('Invalid API key — check your settings.');
  if (res.status === 422) throw new Error('Sport not available or invalid parameters.');
  if (res.status === 429) throw new Error('Monthly API quota exceeded.');
  if (!res.ok) throw new Error(`API error ${res.status}`);

  return res.json() as Promise<OddsEvent[]>;
}

export async function fetchOutrights(
  sportKey: string,
  apiKey: string,
  bookmakerKeys: string[],
): Promise<OddsEvent[]> {
  if (!apiKey) throw new Error('No API key set');
  if (bookmakerKeys.length === 0) throw new Error('No sportsbooks selected');

  const params = new URLSearchParams({
    apiKey,
    regions: 'us',
    markets: 'outrights',
    oddsFormat: 'american',
    bookmakers: bookmakerKeys.join(','),
  });

  const res = await fetch(`${BASE}/sports/${sportKey}/odds?${params}`);
  if (res.status === 401) throw new Error('Invalid API key — check your settings.');
  if (res.status === 422) throw new Error('Sport not available or invalid parameters.');
  if (res.status === 429) throw new Error('Monthly API quota exceeded.');
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<OddsEvent[]>;
}

export async function fetchEventProps(
  sport: string,
  eventId: string,
  markets: string[],
  apiKey: string,
  bookmakerKeys: string[],
): Promise<OddsEvent> {
  if (!apiKey) throw new Error('No API key set');

  const params = new URLSearchParams({
    apiKey,
    markets: markets.join(','),
    oddsFormat: 'american',
    bookmakers: bookmakerKeys.join(','),
  });

  const res = await fetch(`${BASE}/sports/${sport}/events/${eventId}/odds?${params}`);
  if (res.status === 401) throw new Error('Invalid API key — check your settings.');
  if (res.status === 404) throw new Error('Event not found or props not available.');
  if (res.status === 422) throw new Error('Props not available for this sport.');
  if (res.status === 429) throw new Error('Monthly API quota exceeded.');
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<OddsEvent>;
}
