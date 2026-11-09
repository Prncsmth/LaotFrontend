import { DEPT_LABEL, dateTime } from '@/lib/format';
import type { Department } from '@/lib/api';

export type IntegrationEvent = {
  id: number;
  type: string;
  sourceDept: Department;
  targetDept: Department | null;
  entityType: string;
  entityId: number;
  message: string;
  createdAt: string;
};

const DEPT_SHORT: Record<Department, string> = {
  ADMIN: 'Admin', OPERATIONS: 'Operations', SALES: 'Sales & Logistics', FINANCE: 'Finance',
};

/** A hand-off from one department to another, e.g. "Operations → Sales: lot stored, available for sale". */
export function EventList({ events, compact }: { events: IntegrationEvent[]; compact?: boolean }) {
  if (!events.length) return <p className="text-sm text-slate-500">No events yet.</p>;
  return (
    <ol className="space-y-3">
      {events.map((e) => (
        <li key={e.id} className="flex gap-3">
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${e.type.includes('Alert') || e.type.includes('Quarantined') || e.type === 'HandlerFailed' ? 'bg-red-500' : 'bg-cyan-600'}`} aria-hidden />
          <div className="min-w-0 text-sm">
            <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
              <span className="font-semibold text-slate-700" title={DEPT_LABEL[e.sourceDept]}>
                {DEPT_SHORT[e.sourceDept]}
              </span>
              {e.targetDept && e.targetDept !== e.sourceDept && (
                <>
                  <span aria-label="to">→</span>
                  <span className="font-semibold text-slate-700" title={DEPT_LABEL[e.targetDept]}>
                    {DEPT_SHORT[e.targetDept]}
                  </span>
                </>
              )}
              <span className="rounded bg-slate-100 px-1.5 font-mono text-[11px] text-slate-600">{e.type}</span>
              <span>{dateTime(e.createdAt)}</span>
            </p>
            <p className={`text-slate-700 ${compact ? 'line-clamp-2' : ''}`}>{e.message}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
