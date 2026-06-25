export default function Header() {
  return (
    <header className="border-b border-[#1A2A40] bg-[#0D1625]/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M3 9 L9 3 L15 9 L9 15 Z"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M9 6 L12 9 L9 12 L6 9 Z"
                fill="white"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-none">Hedge</h1>
            <p className="text-xs text-slate-500 leading-none mt-0.5">Lock in your profits</p>
          </div>
        </div>
        <span className="text-xs text-slate-600 font-mono">v1.0</span>
      </div>
    </header>
  );
}
