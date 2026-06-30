import { useState, useRef, useEffect } from 'react';

interface Props {
  label: string;
  text: string;
}

// Tappable info icon + popover. One instance per new Pro-tab analytics feature
// (vig display, EV, Kelly, CLV, line shopping) — matches the existing
// "explainer card" visual language (bg-[#100020] rounded-xl p-4, uppercase
// label, slate-400 body) used in Opportunities.tsx / SettingsPanel.tsx.
export default function InfoTooltip({ label, text }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`More info: ${label}`}
        aria-expanded={open}
        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono text-slate-500 border border-[#3D1A6E] hover:border-purple-500/40 hover:text-purple-400 transition-colors"
      >
        i
      </button>

      {open && (
        <div className="absolute z-30 top-7 left-1/2 -translate-x-1/2 w-64 bg-[#100020] border border-[#3D1A6E] rounded-xl p-4 space-y-2 shadow-2xl animate-fade-in">
          <p className="text-xs font-semibold text-slate-300 uppercase tracking-widest">{label}</p>
          <p className="text-xs text-slate-400 leading-relaxed">{text}</p>
        </div>
      )}
    </div>
  );
}
