const KEYS = {
  API_KEY: 'hedge_api_key',
  SELECTED_BOOKS: 'hedge_selected_books',
  SELECTED_SPORT: 'hedge_selected_sport',
} as const;

export function getApiKey(): string {
  return localStorage.getItem(KEYS.API_KEY) ?? '';
}

export function setApiKey(key: string): void {
  localStorage.setItem(KEYS.API_KEY, key.trim());
}

export function getSelectedBooks(): string[] {
  try {
    const raw = localStorage.getItem(KEYS.SELECTED_BOOKS);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function setSelectedBooks(books: string[]): void {
  localStorage.setItem(KEYS.SELECTED_BOOKS, JSON.stringify(books));
}

export function getSelectedSport(): string {
  return localStorage.getItem(KEYS.SELECTED_SPORT) ?? 'americanfootball_nfl';
}

export function setSelectedSport(sport: string): void {
  localStorage.setItem(KEYS.SELECTED_SPORT, sport);
}
