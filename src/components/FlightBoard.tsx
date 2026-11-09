'use client';

import { useEffect, useState } from 'react';
import { useApi } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { canAccess } from '@/lib/access';
import { LinkButton } from './ui';

// ─────────────────────────────────────────────────────────────
// Airport-style information board, printed in ink on paper.
//   ARRIVALS   = boats landing their catch at the pier
//   DEPARTURES = reefer trucks leaving with buyers' orders
// A blinking orange status means the next department still has to act.
// ─────────────────────────────────────────────────────────────

export type BoardRow = {
  id: number;
  time: string;
  code: string;
  title: string;
  detail: string;
  kg: number;
  status: string;
  tone: 'amber' | 'green' | 'cyan' | 'red';
  live: boolean;
};

const CONFIG = {
  arrivals: {
    title: 'Arrivals',
    subtitle: 'Vessel landings at the pier',
    fig: 'FIG. A',
    cols: ['Time', 'Landing', 'Vessel', 'Catch', 'Kg', 'Status'],
    href: '/landings',
    linkLabel: 'Landing & Grading',
  },
  departures: {
    title: 'Departures',
    subtitle: 'Reefer trucks leaving with orders',
    fig: 'FIG. D',
    cols: ['Time', 'Dispatch', 'Buyer', 'Truck', 'Kg', 'Status'],
    href: '/dispatch',
    linkLabel: 'Dispatch & Delivery',
  },
};

// Muted inks — orange is reserved for "waiting for action".
const STATUS_INK = {
  amber: 'text-accent',
  green: 'text-slate-900',
  cyan: 'text-slate-600',
  red: 'text-red-700',
};

/** Split-flap tile in paper tones: a hairline across the middle like a real flap display. */
function Flap({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block rounded-sm bg-slate-100 px-1.5 py-px font-semibold text-slate-900 tabular-nums"
      style={{ backgroundImage: 'linear-gradient(to bottom, transparent 49%, rgb(17 17 16 / 0.12) 50%, transparent 51%)' }}
    >
      {children}
    </span>
  );
}

function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="text-right leading-tight">
      <p className="font-mono text-[20px] tracking-wider text-slate-900 tabular-nums">{now ? now.toLocaleTimeString('en-GB') : '--:--:--'}</p>
      <p className="font-mono text-[10px] tracking-[0.18em] text-slate-500 uppercase">{now ? now.toLocaleDateString('en-PH', { weekday: 'short', day: '2-digit', month: 'short' }) : ' '}</p>
    </div>
  );
}

function time(iso: string) {
  const d = new Date(iso);
  const today = new Date().toDateString() === d.toDateString();
  return {
    hm: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    day: today ? '' : d.toLocaleDateString('en-PH', { day: '2-digit', month: 'short' }).toUpperCase(),
  };
}

export function FlightBoard({ type, rows: given, take = 8, version = 0 }: { type: 'arrivals' | 'departures'; rows?: BoardRow[]; take?: number; version?: number }) {
  const cfg = CONFIG[type];
  const { user } = useAuth();
  const { data } = useApi<BoardRow[]>(given ? null : `/boards/${type}?take=${take}&v=${version}`);
  const rows = given ?? data;
  const waiting = rows?.filter((r) => r.live).length ?? 0;

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-black/4">
      {/* header */}
      <div className="flex items-end justify-between gap-3 border-b border-line px-5 pt-4 pb-3.5">
        <div>
          <p className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.18em] text-slate-500 uppercase">
            <span className="h-1.5 w-1.5 bg-accent" aria-hidden />
            {cfg.fig} · {cfg.subtitle}
          </p>
          <h2 className="mt-1 text-[24px] font-bold tracking-[-0.02em] text-slate-900">
            {cfg.title}
            {waiting > 0 && <span className="ml-3 align-middle font-mono text-[11px] tracking-widest text-accent uppercase">{waiting} waiting</span>}
          </h2>
        </div>
        <Clock />
      </div>

      {/* rows */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-140 font-mono text-[12.5px]">
          <thead>
            <tr className="border-b border-line text-left text-[10px] tracking-[0.16em] text-slate-500 uppercase">
              {cfg.cols.map((c, i) => (
                <th key={c} className={`px-3 py-2 font-normal first:pl-5 last:pr-5 ${i === 4 ? 'text-right' : ''} ${i === 3 ? 'hidden md:table-cell' : ''}`}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {!rows ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center tracking-[0.15em] text-slate-400">
                  LOADING…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center tracking-[0.15em] text-slate-400 uppercase">
                  No {cfg.title} yet
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => {
                const t = time(r.time);
                return (
                  <tr key={r.id} className="animate-flap hover:bg-paper" style={{ animationDelay: `${idx * 50}ms` }}>
                    <td className="px-3 py-2.5 pl-5 whitespace-nowrap">
                      <Flap>{t.hm}</Flap>
                      {t.day && <span className="ml-1.5 text-[10px] text-slate-400">{t.day}</span>}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">{r.code.replace(/^(\w+)-\d{6}-/, '$1-')}</td>
                    <td className="max-w-[16rem] truncate px-3 py-2.5 tracking-wide text-slate-900 uppercase" title={r.title}>
                      {r.title}
                    </td>
                    <td className="hidden max-w-48 truncate px-3 py-2.5 text-slate-500 uppercase md:table-cell" title={r.detail}>
                      {r.detail}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-900 tabular-nums">{r.kg.toLocaleString('en-PH')}</td>
                    <td className="px-3 py-2.5 pr-5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 tracking-[0.08em] ${STATUS_INK[r.tone]} ${r.live ? 'animate-blink' : ''}`}>
                        <span className={`h-1.5 w-1.5 ${r.live ? 'rounded-full bg-accent' : 'bg-current'}`} aria-hidden />
                        {r.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {canAccess(user?.department, cfg.href) && (
        <div className="flex justify-end border-t border-line bg-slate-50/60 px-5 py-3">
          <LinkButton href={cfg.href}>Open {cfg.linkLabel}</LinkButton>
        </div>
      )}
    </section>
  );
}
