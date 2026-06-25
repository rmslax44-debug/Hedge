export type OddsFormat = 'american' | 'decimal';
export type BetMode = 'straight' | 'parlay';

export function parseOdds(input: string, format: OddsFormat): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const v = parseFloat(trimmed);
  if (isNaN(v)) return null;

  if (format === 'american') {
    // Valid American odds: ≥ +100 or ≤ -100
    if (v > 0 && v < 100) return null;
    if (v < 0 && v > -100) return null;
    if (v === 0) return null;
    if (v > 0) return v / 100 + 1;
    return 100 / Math.abs(v) + 1;
  }

  // Decimal: must be > 1
  if (v <= 1) return null;
  return v;
}

export function decimalToAmerican(decimal: number): string {
  if (decimal >= 2) {
    const v = Math.round((decimal - 1) * 100);
    return `+${v}`;
  }
  return `${Math.round(-100 / (decimal - 1))}`;
}

export interface HedgeResult {
  optimalHedgeStake: number;
  hedgeStakeUsed: number;
  profitIfOriginalWins: number;
  profitIfHedgeWins: number;
  totalInvested: number;
  guaranteedProfit: number;
  isGuaranteedProfit: boolean;
  roi: number;
  // No-hedge comparison
  noHedgeProfitIfWins: number;
  noHedgeLossIfLoses: number;
}

export function calculate(
  originalStake: number,
  originalPayout: number,
  hedgeDecimalOdds: number,
  hedgeStakeOverride?: number,
): HedgeResult {
  const optimalHedgeStake = originalPayout / hedgeDecimalOdds;
  const hedgeStakeUsed = hedgeStakeOverride ?? optimalHedgeStake;
  const hedgePayout = hedgeStakeUsed * hedgeDecimalOdds;
  const totalInvested = originalStake + hedgeStakeUsed;

  const profitIfOriginalWins = originalPayout - totalInvested;
  const profitIfHedgeWins = hedgePayout - totalInvested;
  const guaranteedProfit = Math.min(profitIfOriginalWins, profitIfHedgeWins);

  return {
    optimalHedgeStake,
    hedgeStakeUsed,
    profitIfOriginalWins,
    profitIfHedgeWins,
    totalInvested,
    guaranteedProfit,
    isGuaranteedProfit: guaranteedProfit > 0.005,
    roi: guaranteedProfit / totalInvested,
    noHedgeProfitIfWins: originalPayout - originalStake,
    noHedgeLossIfLoses: -originalStake,
  };
}

export function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  const formatted = abs.toFixed(2);
  return value < 0 ? `-$${formatted}` : `$${formatted}`;
}

export function formatProfit(value: number): string {
  const abs = Math.abs(value);
  const formatted = abs.toFixed(2);
  return value < 0 ? `-$${formatted}` : `+$${formatted}`;
}

export function formatPercent(value: number): string {
  const abs = Math.abs(value * 100);
  const formatted = abs.toFixed(1);
  return value < 0 ? `-${formatted}%` : `+${formatted}%`;
}
