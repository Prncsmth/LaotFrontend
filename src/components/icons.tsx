// Line icons in the style of Apple's SF Symbols (24×24, rounded strokes).
import type { SVGProps } from 'react';

const PATHS = {
  home: 'M3 10.5 12 3l9 7.5M5.5 9v11h4.5v-6h4v6h4.5V9',
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2M14 18h2v2M18 18h2v2h-2',
  anchor: 'M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 0v14m0 0c-4.5 0-8-3-8-7m8 7c4.5 0 8-3 8-7M8 11h8M2 14h4m12 0h4',
  snow: 'M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11M9 4l3 2 3-2M9 20l3-2 3 2M3.5 10l2.5 1.5-.5 3M20.5 10 18 11.5l.5 3',
  tag: 'M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Zm4.5-4.5h.01',
  truck: 'M2 6h11v10H2zM13 9h4.5l3.5 3.5V16h-8M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  wallet: 'M3 7a2 2 0 0 1 2-2h13v4M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2Zm13 7h.01',
  gauge: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Zm0-9 4-4M7 15h.01M17 15h.01M12 7h.01',
  alert: 'M12 3 2 20h20L12 3Zm0 6v5m0 3h.01',
  sliders: 'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4',
  copy: 'M8 8h12v12H8zM4 16V4h12',
  sparkles: 'M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3ZM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z',
  flow: 'M4 7h12m0 0-3-3m3 3-3 3M20 17H8m0 0 3-3m-3 3 3 3',
  clock: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Zm0-13v4.5l3 2',
  fish: 'M6.5 12c2.3-3.4 5.8-4.8 9.2-4.1 2.4.5 4.3 2 5.3 4.1-1 2.1-2.9 3.6-5.3 4.1-3.4.7-6.9-.7-9.2-4.1Zm0 0L2.5 8.5v7l4-3.5ZM16.5 11h.01',
  person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
  boat: 'M3 15h18l-2 5H5l-2-5Zm2 0V9h10l3 6M9 9V4h3v5',
  building: 'M4 21V5l8-2v18M12 7l8 2v12M2 21h20M8 8h.01M8 12h.01M8 16h.01M16 12h.01M16 16h.01',
  box: 'M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Zm0 0L12 12m0 0 9-4.5M12 12v9',
  badge: 'M9 3h6v4H9zM5 5h4m6 0h4v16H5V5Zm7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-3.5 5a3.5 3.5 0 0 1 7 0',
  logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11',
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12.5 10 17 19 7',
  x: 'M6 6l12 12M18 6 6 18',
  search: 'M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm5-2 4 4',
  menu: 'M4 7h16M4 12h16M4 17h16',
  chevron: 'M9 6l6 6-6 6',
  info: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Zm0-11v6m0-9h.01',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  eyeOff: 'M3 3l18 18M10.6 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7c1.9 0 3.5-.6 4.9-1.4M9.9 9.9a3 3 0 0 0 4.2 4.2',
  scale:'M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0L5 7Zm14 0-3 7a3 3 0 0 0 6 0l-3-7ZM8 21h8',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = 'h-5 w-5', ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden {...props}>
      <path d={PATHS[name]} />
    </svg>
  );
}
