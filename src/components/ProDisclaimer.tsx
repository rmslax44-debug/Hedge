// Reusable guardrail card for the Pro-tab analytics suite (EV/Kelly panel in
// CALC, CLV section in Portfolio). Mirrors the existing risk-disclosure card
// pattern in SettingsPanel.tsx (amber-tinted card, uppercase label).
export default function ProDisclaimer() {
  return (
    <div className="card p-4 space-y-2 border-amber-500/25 bg-amber-500/5">
      <p className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
        No strategy guarantees profit
      </p>
      <p className="text-xs text-slate-400 leading-relaxed">
        EV and Kelly numbers are estimates built from your own probability input — they're only as good as that estimate. A positive edge plays out over a large number of bets; any single bet can still lose. Stake only what you can afford to lose, and treat every recommendation here as a starting point, not an instruction.
      </p>
      <p className="text-xs text-slate-500 leading-relaxed">
        If betting stops being fun, call or text the National Problem Gambling Helpline at{' '}
        <a href="tel:18005224700" className="text-slate-300 underline underline-offset-2">1-800-522-4700</a>.
      </p>
    </div>
  );
}
