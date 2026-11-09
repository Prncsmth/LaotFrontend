'use client';

import { Fragment, useState } from 'react';
import { useApi } from '@/lib/hooks';
import { DEPT_LABEL, dateTime } from '@/lib/format';
import { Badge, Card, ErrorBox, Field, Loading, PageHeader, Select, type Tone } from '@/components/ui';
import type { Department } from '@/lib/api';

type Log = {
  id: number; action: string; entityType: string; entityId: number | null; createdAt: string;
  before: Record<string, any> | null; after: Record<string, any> | null;
  user: { name: string; department: Department } | null;
};

const ACTION_TONE: Record<string, Tone> = { CREATE: 'green', UPDATE: 'blue', DELETE: 'red', MERGE: 'violet' };
const IGNORE = new Set(['updatedAt', 'createdAt']);
const ENTITIES = ['Fisher', 'Buyer', 'Vessel', 'Species', 'Landing', 'Lot', 'SalesOrder', 'Dispatch', 'Invoice', 'Payment', 'FisherSettlement', 'StorageUnit', 'Truck', 'User', 'DqRule'];

function changes(log: Log) {
  if (log.action === 'UPDATE' && log.before && log.after) {
    return Object.keys(log.after)
      .filter((k) => !IGNORE.has(k) && JSON.stringify(log.before![k]) !== JSON.stringify(log.after![k]))
      .map((k) => ({ field: k, before: log.before![k], after: log.after![k] }));
  }
  const row = log.after ?? log.before ?? {};
  return Object.entries(row)
    .filter(([k, v]) => !IGNORE.has(k) && v !== null && k !== 'id')
    .map(([k, v]) => ({ field: k, before: log.action === 'CREATE' ? undefined : v, after: log.action === 'CREATE' ? v : undefined }));
}

const show = (v: unknown) => (v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v));

export default function AuditPage() {
  const [entityType, setEntityType] = useState('');
  const [open, setOpen] = useState<number | null>(null);
  const { data, error } = useApi<Log[]>(`/audit-logs${entityType ? `?entityType=${entityType}` : ''}`);

  return (
    <>
      <PageHeader title="Audit Trail" subtitle="Who changed what, and when — recorded automatically for every create, update, delete and merge. Click a row to see the old and new values." />
      <ErrorBox error={error} />
      <Card
        padded={false}
        title={data ? `${data.length} most recent changes` : 'Changes'}
        actions={
          <Field label="" className="w-48">
            <Select value={entityType} onChange={(e) => setEntityType(e.target.value)} aria-label="Filter by record type">
              <option value="">All record types</option>
              {ENTITIES.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </Select>
          </Field>
        }
      >
        {!data ? (
          <Loading />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5">When</th>
                  <th className="px-4 py-2.5">Who</th>
                  <th className="px-4 py-2.5">Action</th>
                  <th className="px-4 py-2.5">Record</th>
                  <th className="px-4 py-2.5">Changed fields</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((l) => {
                  const ch = changes(l);
                  return (
                    <Fragment key={l.id}>
                      <tr className="cursor-pointer hover:bg-slate-50" onClick={() => setOpen(open === l.id ? null : l.id)}>
                        <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{dateTime(l.createdAt)}</td>
                        <td className="px-4 py-2.5">
                          {l.user ? (
                            <>
                              {l.user.name}
                              <span className="block text-xs text-slate-500">{DEPT_LABEL[l.user.department]}</span>
                            </>
                          ) : (
                            <span className="text-slate-400">system</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge tone={ACTION_TONE[l.action] ?? 'gray'}>{l.action}</Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          {l.entityType} #{l.entityId}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{l.action === 'UPDATE' ? ch.map((c) => c.field).join(', ') || '—' : `${ch.length} fields`}</td>
                      </tr>
                      {open === l.id && (
                        <tr>
                          <td colSpan={5} className="bg-slate-50 px-4 py-3">
                            <table className="text-xs">
                              <tbody>
                                {ch.map((c) => (
                                  <tr key={c.field}>
                                    <td className="py-0.5 pr-4 font-medium text-slate-600">{c.field}</td>
                                    <td className="py-0.5 pr-2 text-red-700 line-through decoration-red-300">{show(c.before)}</td>
                                    <td className="py-0.5 text-emerald-700">{show(c.after)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
