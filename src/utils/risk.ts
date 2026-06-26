export type RiskTier = 'low' | 'medium' | 'high' | 'extreme';

export interface RiskInfo {
  tier: RiskTier;
  tierIndex: number; // 0-3, used to fill segments
  impliedProb: number; // 0-1
  label: string;
  sublabel: string;
  barColor: string; // tailwind bg class
  textColor: string; // tailwind text class
  borderColor: string; // tailwind border class
  bgColor: string; // tailwind bg/10 class
}

// Derives risk from stake and potential payout (total returned if win).
// implied_probability = stake / potentialPayout (what the odds imply your chances are)
export function calcRisk(stake: number, potentialPayout: number): RiskInfo {
  if (potentialPayout <= 0 || stake <= 0) {
    return {
      tier: 'low', tierIndex: 0, impliedProb: 0.5, label: 'Unknown', sublabel: '',
      barColor: 'bg-slate-500', textColor: 'text-slate-400',
      borderColor: 'border-slate-500/30', bgColor: 'bg-slate-500/10',
    };
  }

  const impliedProb = stake / potentialPayout;

  // > 40% implied prob → even money or favorite (e.g. -150, +100 to +150)
  if (impliedProb > 0.4) {
    return {
      tier: 'low', tierIndex: 0, impliedProb,
      label: 'Low Risk',
      sublabel: 'Near even odds — solid chance to win',
      barColor: 'bg-green-500',
      textColor: 'text-green-400',
      borderColor: 'border-green-500/30',
      bgColor: 'bg-green-500/8',
    };
  }
  // 20-40% → decent underdog (+150 to +400)
  if (impliedProb > 0.2) {
    return {
      tier: 'medium', tierIndex: 1, impliedProb,
      label: 'Medium Risk',
      sublabel: 'Underdog — possible but not likely',
      barColor: 'bg-yellow-400',
      textColor: 'text-yellow-400',
      borderColor: 'border-yellow-500/30',
      bgColor: 'bg-yellow-500/8',
    };
  }
  // 8-20% → long shot (+400 to +1150)
  if (impliedProb > 0.08) {
    return {
      tier: 'high', tierIndex: 2, impliedProb,
      label: 'High Risk',
      sublabel: 'Long shot — hedge early if it starts winning',
      barColor: 'bg-orange-500',
      textColor: 'text-orange-400',
      borderColor: 'border-orange-500/30',
      bgColor: 'bg-orange-500/8',
    };
  }
  // < 8% → true futures / extreme underdog (+1150+)
  return {
    tier: 'extreme', tierIndex: 3, impliedProb,
    label: 'Long Shot',
    sublabel: 'Futures-level risk — rare to win, big if you do',
    barColor: 'bg-red-500',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/30',
    bgColor: 'bg-red-500/8',
  };
}
