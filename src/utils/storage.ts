// ─── Sportsbook / API settings ───────────────────────────────────────────────

export function getApiKey(): string {
  return localStorage.getItem('hedge_api_key') ?? '';
}
export function setApiKey(v: string) {
  localStorage.setItem('hedge_api_key', v.trim());
}

export function getSelectedBooks(): string[] {
  try {
    return JSON.parse(localStorage.getItem('hedge_books') ?? '[]');
  } catch {
    return [];
  }
}
export function setSelectedBooks(v: string[]) {
  localStorage.setItem('hedge_books', JSON.stringify(v));
}

export function getSelectedSport(): string {
  return localStorage.getItem('hedge_sport') ?? 'americanfootball_nfl';
}
export function setSelectedSport(v: string) {
  localStorage.setItem('hedge_sport', v);
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function getNotificationsEnabled(): boolean {
  return localStorage.getItem('hedge_notify') === 'true';
}
export function setNotificationsEnabled(v: boolean) {
  localStorage.setItem('hedge_notify', String(v));
}

// ─── Tracked bets ─────────────────────────────────────────────────────────────

export type BetStatus = 'monitoring' | 'hedge_ready' | 'hedged' | 'settled';

export interface HedgeOpportunity {
  hedgeTeam: string;
  hedgeBook: string;
  hedgeBookKey: string;
  hedgeStake: number;
  hedgeOdds: number; // American
  guaranteedProfit: number;
  foundAt: number;
}

export interface TrackedBet {
  id: string;
  createdAt: number;
  label: string;
  myTeam: string;
  sportsbook: string;
  stake: number;
  potentialPayout: number; // total returned if wins (stake + profit)
  sport: string;
  eventId?: string; // The Odds API event ID for auto-monitoring
  opposingTeam?: string;
  status: BetStatus;
  hedgeOpportunity?: HedgeOpportunity;
}

function loadBets(): TrackedBet[] {
  try {
    return JSON.parse(localStorage.getItem('hedge_bets') ?? '[]');
  } catch {
    return [];
  }
}
function saveBets(bets: TrackedBet[]) {
  localStorage.setItem('hedge_bets', JSON.stringify(bets));
}

export function getAllBets(): TrackedBet[] {
  return loadBets();
}

export function addBet(bet: Omit<TrackedBet, 'id' | 'createdAt' | 'status'>): TrackedBet {
  const newBet: TrackedBet = {
    ...bet,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    status: 'monitoring',
  };
  const bets = loadBets();
  bets.unshift(newBet);
  saveBets(bets);
  return newBet;
}

export function updateBet(id: string, updates: Partial<TrackedBet>) {
  const bets = loadBets().map((b) => (b.id === id ? { ...b, ...updates } : b));
  saveBets(bets);
}

export function deleteBet(id: string) {
  saveBets(loadBets().filter((b) => b.id !== id));
}

export function markHedged(id: string) {
  updateBet(id, { status: 'hedged', hedgeOpportunity: undefined });
}
