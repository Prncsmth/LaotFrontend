'use client';

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { useEffect } from 'react';
import Link from 'next/link';
import { Icon, type IconName } from './icons';

// Apple-style building blocks: large titles, white rounded cards, pill buttons,
// segmented controls, iOS switches and sheet-style modals — in a monochrome palette.

// ───────── Layout ─────────

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-140">
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-slate-900 sm:text-[32px]">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-3xl text-[15px] leading-relaxed text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className = '', padded = true }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={`rounded-2xl bg-white shadow-card ring-1 ring-black/4 ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4 pb-3">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-slate-900">{title}</h2>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={padded ? `px-5 pb-5 ${title || actions ? '' : 'pt-5'}` : ''}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, sub, tone = 'default', icon }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'default' | 'warn' | 'bad' | 'good'; icon?: IconName }) {
  const color = { default: 'text-slate-900', warn: 'text-amber-700', bad: 'text-red-700', good: 'text-emerald-700' }[tone];
  const iconBg = { default: 'bg-slate-100 text-slate-700', warn: 'bg-amber-50 text-amber-700', bad: 'bg-red-50 text-red-700', good: 'bg-emerald-50 text-emerald-700' }[tone];
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-black/4">
      <div className="flex items-center gap-2">
        {icon && (
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBg}`}>
            <Icon name={icon} className="h-4 w-4" />
          </span>
        )}
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
      </div>
      <p className={`mt-2 text-[26px] font-semibold leading-none tracking-[-0.02em] tabular-nums ${color}`}>{value}</p>
      {sub && <p className="mt-2 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

// ───────── Buttons, badges, controls ─────────

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; size?: 'sm' | 'md'; icon?: IconName };

export function Button({ variant = 'primary', size = 'md', icon, className = '', children, ...props }: ButtonProps) {
  const v = {
    primary: 'bg-slate-900 text-white shadow-sm hover:bg-black active:bg-black disabled:bg-slate-300 disabled:shadow-none',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50',
    danger: 'bg-red-700 text-white shadow-sm hover:bg-red-800 disabled:bg-slate-300',
    ghost: 'text-slate-900 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-50',
  }[variant];
  const s = size === 'sm' ? 'h-7 px-3 text-[13px]' : 'h-9 px-4 text-sm';
  return (
    <button className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/20 disabled:cursor-not-allowed ${v} ${s} ${className}`} {...props}>
      {icon && <Icon name={icon} className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
      {children}
    </button>
  );
}

/** A link that looks like the primary pill button, with an arrow — e.g. "Open Landing & Grading ›". */
export function LinkButton({ href, children, size = 'md' }: { href: string; children: ReactNode; size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'h-8 px-3.5 text-[13px]' : 'h-9 px-4 text-sm';
  return (
    <Link
      href={href}
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-900 font-medium text-white shadow-sm transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/20 ${s}`}
    >
      {children} <Icon name="chevron" className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
    </Link>
  );
}

/** iOS-style segmented control — use for tabs and filters. */
export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[] }) {
  return (
    <div className="inline-flex rounded-[10px] bg-slate-200/70 p-0.5" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-3.5 py-1 text-[13px] font-medium transition-all duration-150 ${value === o.value ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/4' : 'text-slate-600 hover:text-slate-900'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** iOS-style on/off switch. */
export function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: ReactNode }) {
  return (
    <label className={`inline-flex items-center gap-2.5 text-sm text-slate-700 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6.5 w-11 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/20 ${checked ? 'bg-slate-900' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 h-5.5 w-5.5 rounded-full bg-white shadow-md transition-transform duration-200 ${checked ? 'translate-x-4.5' : ''}`} />
      </button>
      {label}
    </label>
  );
}

const TONES = {
  gray: 'bg-slate-100 text-slate-600',
  blue: 'bg-slate-100 text-slate-800',
  cyan: 'bg-slate-900 text-white',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  violet: 'bg-slate-200 text-slate-800',
};
export type Tone = keyof typeof TONES;

export function Badge({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}>{children}</span>;
}

const STATUS_TONE: Record<string, Tone> = {
  RECEIVED: 'amber', GRADED: 'blue', IN_STORAGE: 'cyan', RESERVED: 'violet', DELIVERED: 'green', QUARANTINED: 'red', SPOILED: 'gray',
  DRAFT: 'amber', CONFIRMED: 'blue', DISPATCHED: 'violet', CANCELLED: 'gray',
  PENDING: 'amber', IN_TRANSIT: 'violet',
  UNPAID: 'red', PARTIAL: 'amber', PAID: 'green', APPROVED: 'blue',
  OPEN: 'red', RESOLVED: 'green', IGNORED: 'gray',
  ACTIVE: 'green', MERGED: 'gray', INACTIVE: 'gray',
  BLOCK: 'red', WARN: 'amber',
};

/** Status shown as a soft pill with a dot. Text always says the status, so colour is never the only cue. */
export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? 'gray';
  const text = status.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  return (
    <Badge tone={tone}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden />
      {text}
    </Badge>
  );
}

// ───────── Tables ─────────

export type Column<T> = { header: ReactNode; cell: (row: T) => ReactNode; className?: string };

export function DataTable<T>({ columns, rows, empty = 'Nothing here yet.', rowKey, rowClass }: { columns: Column<T>[]; rows?: T[]; empty?: string; rowKey: (row: T) => string | number; rowClass?: (row: T) => string }) {
  if (!rows) return <Loading />;
  if (!rows.length) return <Empty text={empty} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-y border-slate-200/70 bg-slate-50/80">
            {columns.map((c, i) => (
              <th key={i} className={`whitespace-nowrap px-5 py-2 text-xs font-medium text-slate-500 ${c.className ?? ''}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/60">
          {rows.map((r) => (
            <tr key={rowKey(r)} className={`align-top transition-colors hover:bg-slate-50/70 ${rowClass?.(r) ?? ''}`}>
              {columns.map((c, i) => (
                <td key={i} className={`px-5 py-3 text-slate-700 ${c.className ?? ''}`}>
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ───────── Forms ─────────

export function Field({ label, hint, children, className = '' }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1.5 block text-[13px] font-medium text-slate-600">{label}</span>}
      {children}
      {hint && <span className="mt-1.5 block text-xs leading-relaxed text-slate-500">{hint}</span>}
    </label>
  );
}

const inputClass =
  'h-9 rounded-[10px] border-0 bg-slate-100 px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-2 focus:ring-slate-900/50 disabled:opacity-60';

// Full width unless the caller gives its own width (e.g. "w-24").
const width = (className?: string) => (/(^|\s)w-/.test(className ?? '') ? '' : 'w-full');

export const Input = (props: InputHTMLAttributes<HTMLInputElement>) => <input {...props} className={`${inputClass} ${width(props.className)} ${props.className ?? ''}`} />;

export const Select = ({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={`${inputClass} ${width(props.className)} pr-8 ${props.className ?? ''}`}>
    {children}
  </select>
);

// ───────── Overlays & states ─────────

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex animate-fade items-start justify-center overflow-y-auto bg-black/25 p-4 pt-[8vh] backdrop-blur-[2px]" onMouseDown={onClose}>
      <div
        className={`w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} animate-sheet rounded-2xl bg-white/95 shadow-pop ring-1 ring-black/5 backdrop-blur-xl`}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-slate-900">{title}</h3>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800" aria-label="Close">
            <Icon name="x" className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="space-y-4 px-5 py-3">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-5 pt-2 pb-5">{footer}</div>}
      </div>
    </div>
  );
}

export const Loading = () => (
  <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-slate-400">
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" aria-hidden />
    Loading…
  </div>
);

export const Empty = ({ text }: { text: string }) => <p className="px-5 py-10 text-center text-sm text-slate-500">{text}</p>;

export const ErrorBox = ({ error }: { error?: string | null }) =>
  error ? (
    <div className="mb-5 flex items-start gap-2.5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200/60">
      <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
      {error}
    </div>
  ) : null;

/** Horizontal meter for a 0–100 score or a load/capacity value. */
export function Meter({ value, max = 100, label, right, tone }: { value: number; max?: number; label: ReactNode; right?: ReactNode; tone?: 'auto' | 'neutral' }) {
  const pctValue = Math.max(0, Math.min(100, (value / max) * 100));
  const color = tone === 'neutral' ? 'bg-slate-900' : pctValue >= 95 ? 'bg-emerald-600' : pctValue >= 85 ? 'bg-amber-400' : 'bg-accent';
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
        <span className="text-slate-700">{label}</span>
        <span className="font-semibold tabular-nums text-slate-900">{right}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/70" role="meter" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={max}>
        <div className={`h-full rounded-full transition-[width] duration-500 ${color}`} style={{ width: `${pctValue}%` }} />
      </div>
    </div>
  );
}

/** Score status shown as text + icon, never colour alone. */
export function ScoreStatus({ score }: { score: number }) {
  if (score >= 95) return <Badge tone="green"><Icon name="check" className="h-3 w-3" /> Good</Badge>;
  if (score >= 85) return <Badge tone="amber"><Icon name="alert" className="h-3 w-3" /> Needs attention</Badge>;
  return <Badge tone="red"><Icon name="x" className="h-3 w-3" /> Poor</Badge>;
}
