import type { Department } from './api';

const n = (v: unknown) => Number(v ?? 0);

export const kg = (v: unknown) => `${n(v).toLocaleString('en-PH', { maximumFractionDigits: 2 })} kg`;
export const peso = (v: unknown) => `₱${n(v).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const pct = (v: unknown) => `${n(v).toLocaleString('en-PH', { maximumFractionDigits: 1 })}%`;

export const dateTime = (v?: string | Date | null) =>
  v ? new Date(v).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';

export const date = (v?: string | Date | null) => (v ? new Date(v).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

export function timeAgo(v?: string | Date | null) {
  if (!v) return '—';
  const mins = Math.round((Date.now() - new Date(v).getTime()) / 60000);
  if (mins < 0) {
    const ahead = -mins;
    return ahead < 60 ? `in ${ahead} min` : ahead < 2880 ? `in ${Math.round(ahead / 60)} h` : `in ${Math.round(ahead / 1440)} d`;
  }
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  if (mins < 2880) return `${Math.round(mins / 60)} h ago`;
  return `${Math.round(mins / 1440)} d ago`;
}

/** For <input type="datetime-local"> */
export const toLocalInput = (d: Date) => {
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export const DEPT_LABEL: Record<Department, string> = {
  ADMIN: 'Admin',
  OPERATIONS: 'Operations',
  SALES: 'Sales & Logistics',
  FINANCE: 'Finance',
};

export const DIMENSION_LABEL: Record<string, string> = {
  COMPLETENESS: 'Completeness',
  VALIDITY: 'Validity',
  ACCURACY: 'Accuracy',
  UNIQUENESS: 'Uniqueness',
  CONSISTENCY: 'Consistency',
  TIMELINESS: 'Timeliness',
};

/** "IN_STORAGE" → "In storage", "SalesOrderItem" → "Sales order item" */
export const label = (s?: string | null) =>
  s
    ? s
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/^\w/, (c) => c.toUpperCase())
    : '—';
