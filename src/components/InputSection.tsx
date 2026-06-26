import { OddsFormat, BetMode } from '../utils/odds';

interface InputSectionProps {
  oddsFormat: OddsFormat;
  onOddsFormatChange: (f: OddsFormat) => void;
  betMode: BetMode;
  onBetModeChange: (m: BetMode) => void;
  originalOdds: string;
  onOriginalOddsChange: (v: string) => void;
  originalStake: string;
  onOriginalStakeChange: (v: string) => void;
  potentialPayout: string;
  onPotentialPayoutChange: (v: string) => void;
  hedgeOdds: string;
  onHedgeOddsChange: (v: string) => void;
  originalLabel: string;
  onOriginalLabelChange: (v: string) => void;
  hedgeLabel: string;
  onHedgeLabelChange: (v: string) => void;
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex bg-[#180032] rounded-xl p-1 gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-all duration-150 ${
            value === opt.value
              ? 'bg-purple-500 text-white shadow-sm shadow-purple-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
      {children}
    </label>
  );
}

function InputRow({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1">{children}</div>;
}

function PrefixInput({
  prefix,
  placeholder,
  value,
  onChange,
  hint,
}: {
  prefix: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm pointer-events-none">
        {prefix}
      </span>
      <input
        type="number"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field pl-8"
        min="0"
        step="any"
      />
      {hint && <p className="text-xs text-slate-600 mt-1 pl-1">{hint}</p>}
    </div>
  );
}

export default function InputSection({
  oddsFormat,
  onOddsFormatChange,
  betMode,
  onBetModeChange,
  originalOdds,
  onOriginalOddsChange,
  originalStake,
  onOriginalStakeChange,
  potentialPayout,
  onPotentialPayoutChange,
  hedgeOdds,
  onHedgeOddsChange,
  originalLabel,
  onOriginalLabelChange,
  hedgeLabel,
  onHedgeLabelChange,
}: InputSectionProps) {
  const oddsPlaceholder = oddsFormat === 'american' ? '-110 or +150' : '1.91 or 2.50';

  return (
    <div className="space-y-4">
      {/* Format + Mode controls */}
      <div className="card p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Bet Type</Label>
            <SegmentedControl
              options={[
                { label: 'Straight', value: 'straight' as BetMode },
                { label: 'Parlay', value: 'parlay' as BetMode },
              ]}
              value={betMode}
              onChange={onBetModeChange}
            />
          </div>
          <div>
            <Label>Odds Format</Label>
            <SegmentedControl
              options={[
                { label: 'American', value: 'american' as OddsFormat },
                { label: 'Decimal', value: 'decimal' as OddsFormat },
              ]}
              value={oddsFormat}
              onChange={onOddsFormatChange}
            />
          </div>
        </div>
      </div>

      {/* Original bet */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
          <h2 className="text-sm font-semibold text-slate-200">Your Original Bet</h2>
        </div>

        <InputRow>
          <Label>Description (optional)</Label>
          <input
            type="text"
            placeholder={betMode === 'parlay' ? 'e.g., 4-leg parlay — last leg Chiefs ML' : 'e.g., Chiefs to win'}
            value={originalLabel}
            onChange={(e) => onOriginalLabelChange(e.target.value)}
            className="input-field font-sans"
          />
        </InputRow>

        {betMode === 'straight' ? (
          <div className="grid grid-cols-2 gap-3">
            <InputRow>
              <Label>Your Odds</Label>
              <input
                type="text"
                placeholder={oddsPlaceholder}
                value={originalOdds}
                onChange={(e) => onOriginalOddsChange(e.target.value)}
                className="input-field"
              />
            </InputRow>
            <InputRow>
              <Label>Stake</Label>
              <PrefixInput
                prefix="$"
                placeholder="100"
                value={originalStake}
                onChange={onOriginalStakeChange}
              />
            </InputRow>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <InputRow>
              <Label>Total Invested</Label>
              <PrefixInput
                prefix="$"
                placeholder="50"
                value={originalStake}
                onChange={onOriginalStakeChange}
                hint="What you paid for the parlay"
              />
            </InputRow>
            <InputRow>
              <Label>If You Win</Label>
              <PrefixInput
                prefix="$"
                placeholder="1500"
                value={potentialPayout}
                onChange={onPotentialPayoutChange}
                hint="Total payout including stake"
              />
            </InputRow>
          </div>
        )}
      </div>

      {/* Hedge bet */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <h2 className="text-sm font-semibold text-slate-200">Hedge Opportunity</h2>
        </div>

        <InputRow>
          <Label>Description (optional)</Label>
          <input
            type="text"
            placeholder="e.g., Eagles to win"
            value={hedgeLabel}
            onChange={(e) => onHedgeLabelChange(e.target.value)}
            className="input-field font-sans"
          />
        </InputRow>

        <InputRow>
          <Label>Hedge Odds</Label>
          <input
            type="text"
            placeholder={oddsPlaceholder}
            value={hedgeOdds}
            onChange={(e) => onHedgeOddsChange(e.target.value)}
            className="input-field"
          />
          <p className="text-xs text-slate-600 pl-1 mt-1">
            The odds for the opposite outcome at your sportsbook
          </p>
        </InputRow>
      </div>
    </div>
  );
}
