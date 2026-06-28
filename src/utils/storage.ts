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

export type BetStatus = 'watching' | 'monitoring' | 'hedge_ready' | 'hedged' | 'settled';
export type BetResult = 'win' | 'loss' | 'push' | 'hedged';

export interface ParlayLeg {
  id: string;
  label: string;
  odds?: number;
  sport?: string;
  eventId?: string;
  status: 'pending' | 'won' | 'lost' | 'push';
}

export interface HedgeOpportunity {
  hedgeTeam: string;
  hedgeBook: string;
  hedgeBookKey: string;
  hedgeStake: number;
  hedgeOdds: number; // American
  guaranteedProfit: number;
  foundAt: number;
  eventTime?: string; // ISO string of game start time
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
  // Parlay fields
  isParlay?: boolean;
  legs?: ParlayLeg[];
  // Notification / watch fields
  notifyHedge?: boolean;
  initialOdds?: number; // American odds when added to watch list
  // Settlement fields
  result?: BetResult;
  settledAt?: number;
  settledPnl?: number; // actual realized P&L
  // Futures / props metadata
  isFutures?: boolean;
  futuresMarket?: string;
  isProp?: boolean;
  propMarket?: string;
  propLine?: number;
  // Hedge value change tracking
  hedgeValueTrend?: 'up' | 'down' | 'gone_negative' | 'expired';
  previousGuaranteedProfit?: number;
}

export interface PortfolioStats {
  totalBets: number;
  activeBets: number;
  wins: number;
  losses: number;
  hedged: number;
  pushes: number;
  totalStaked: number;
  totalPnl: number;
  roi: number;
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

export function addWatchedBet(
  bet: Omit<TrackedBet, 'id' | 'createdAt' | 'status'>,
): TrackedBet {
  const newBet: TrackedBet = {
    ...bet,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    status: 'watching',
  };
  const bets = loadBets();
  bets.unshift(newBet);
  saveBets(bets);
  return newBet;
}

export function addBetWithHedge(
  bet: Omit<TrackedBet, 'id' | 'createdAt' | 'status'> & { hedgeOpportunity: HedgeOpportunity },
): TrackedBet {
  const newBet: TrackedBet = {
    ...bet,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    status: 'hedge_ready',
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
  updateBet(id, { status: 'hedged' });
}

export function settleBet(id: string, result: BetResult) {
  const bet = loadBets().find((b) => b.id === id);
  if (!bet) return;
  let pnl: number;
  if (result === 'win') {
    pnl = bet.potentialPayout - bet.stake;
  } else if (result === 'loss') {
    pnl = -bet.stake;
  } else if (result === 'push') {
    pnl = 0;
  } else {
    pnl = bet.hedgeOpportunity?.guaranteedProfit ?? 0;
  }
  updateBet(id, { status: 'settled', result, settledAt: Date.now(), settledPnl: pnl });
}

export function addLegToParlay(betId: string, leg: Omit<ParlayLeg, 'id'>): void {
  const bets = loadBets();
  const bet = bets.find((b) => b.id === betId);
  if (!bet?.isParlay) return;
  if (!bet.legs) bet.legs = [];
  bet.legs.push({ ...leg, id: crypto.randomUUID() });
  saveBets(bets);
}

export function updateParlayLeg(betId: string, legId: string, status: ParlayLeg['status']) {
  const bets = loadBets();
  const bet = bets.find((b) => b.id === betId);
  if (!bet?.legs) return;
  bet.legs = bet.legs.map((l) => (l.id === legId ? { ...l, status } : l));
  saveBets(bets);
}

export function getPortfolioStats(): PortfolioStats {
  const bets = loadBets();
  const settled = bets.filter((b) => b.status === 'settled' || b.status === 'hedged');
  const active = bets.filter((b) => b.status === 'monitoring' || b.status === 'hedge_ready');

  let wins = 0, losses = 0, hedged = 0, pushes = 0;
  let totalPnl = 0;
  let totalStaked = 0;

  for (const b of bets) {
    totalStaked += b.stake;
  }

  for (const b of settled) {
    const pnl = b.settledPnl ?? 0;
    totalPnl += pnl;
    if (b.result === 'win') wins++;
    else if (b.result === 'loss') losses++;
    else if (b.result === 'hedged' || b.status === 'hedged') hedged++;
    else if (b.result === 'push') pushes++;
  }

  const roi = totalStaked > 0 ? (totalPnl / totalStaked) * 100 : 0;

  return {
    totalBets: bets.length,
    activeBets: active.length,
    wins,
    losses,
    hedged,
    pushes,
    totalStaked,
    totalPnl,
    roi,
  };
}
