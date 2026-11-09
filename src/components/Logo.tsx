// LAOT logo — an app-icon tile with a realistic silver yellowfin tuna (bariles) above two sea waves.

export function LogoMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} role="img" aria-label="LAOT logo">
      <defs>
        <linearGradient id="laot-tile" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2a27" />
          <stop offset="1" stopColor="#111110" />
        </linearGradient>
        {/* silver body: darker back, light belly */}
        <linearGradient id="laot-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8e8d86" />
          <stop offset="0.42" stopColor="#d9d8d1" />
          <stop offset="0.6" stopColor="#f7f6f2" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <linearGradient id="laot-fin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b9b8b1" />
          <stop offset="1" stopColor="#7f7e77" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#laot-tile)" />
      {/* dorsal and anal fins */}
      <path d="M30.5 21.2C32 17 34.5 13.2 38.2 11.2 37 14.8 36.6 18 36.8 20.6Z" fill="url(#laot-fin)" />
      <path d="M30.5 34.8C32 39 34.5 42.8 38.2 44.8 37 41.2 36.6 38 36.8 35.4Z" fill="url(#laot-fin)" />
      {/* forked tail */}
      <path d="M15 28C12.5 24.5 10.2 20.6 8 15.6 10.9 17.2 13.6 20.8 16.6 25.6Z" fill="url(#laot-body)" />
      <path d="M15 28C12.5 31.5 10.2 35.4 8 40.4 10.9 38.8 13.6 35.2 16.6 30.4Z" fill="url(#laot-body)" />
      {/* body */}
      <path d="M56.5 28.4C53.8 23.2 47.5 19.6 39.5 19.4 31 19.2 23.4 22.4 15.2 28 23.4 33.6 31 36.8 39.5 36.6 47.5 36.4 53.8 33 56.5 28.4Z" fill="url(#laot-body)" />
      {/* finlets */}
      <path d="M19.6 25.2l1.2-2.1.6 1.5ZM22.6 23.7l1.2-2.1.6 1.5ZM25.6 22.5l1.2-2.1.6 1.5Z" fill="#b9b8b1" />
      <path d="M19.6 30.8l1.2 2.1.6-1.5ZM22.6 32.3l1.2 2.1.6-1.5ZM25.6 33.5l1.2 2.1.6-1.5Z" fill="#d9d8d1" />
      {/* lateral line, gill and pectoral fin */}
      <path d="M18 28C27 26.8 37 26.4 47 26.9" stroke="#7f7e77" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.7" />
      <path d="M47.6 22C45.6 25.6 45.6 31 47.6 34.6" stroke="#45443f" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <path d="M44.6 29.2C41.6 30.2 38.2 31.8 34.8 34.2 38.6 33.6 42.2 32.2 45.4 30.6Z" fill="#9c9b94" />
      {/* eye */}
      <circle cx="51.2" cy="26.6" r="2.1" fill="#f7f6f2" stroke="#45443f" strokeWidth="0.6" />
      <circle cx="51.5" cy="26.6" r="1.1" fill="#111110" />
      <circle cx="51.9" cy="26.2" r="0.35" fill="#ffffff" />
      {/* sea */}
      <path d="M8 47.5c4.4-3.4 8.8-3.4 13.2 0s8.8 3.4 13.2 0 8.8-3.4 13.2 0 4.4 2.6 4.4 2.6" stroke="#f7f6f2" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.85" />
      <path d="M8 54.5c4.4-3.4 8.8-3.4 13.2 0s8.8 3.4 13.2 0 8.8-3.4 13.2 0 4.4 2.6 4.4 2.6" stroke="#f7f6f2" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.35" />
    </svg>
  );
}

/** Logo + wordmark. `tone="dark"` for use on dark backgrounds. */
export function Logo({ size = 34, tone = 'light' }: { size?: number; tone?: 'light' | 'dark' }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} className="shrink-0" />
      <span className="leading-none">
        <span className={`block text-[16px] font-bold tracking-[-0.01em] ${tone === 'dark' ? 'text-white' : 'text-slate-900'}`}>LAOT</span>
        <span className={`mt-1 block font-mono text-[9.5px] tracking-[0.2em] uppercase ${tone === 'dark' ? 'text-white/55' : 'text-slate-500'}`}>Seafood Trading Corp.</span>
      </span>
    </span>
  );
}
