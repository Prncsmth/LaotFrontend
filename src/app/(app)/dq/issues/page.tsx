'use client';

import { useEffect, useState } from 'react';
import { api, type Department } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { canAccess } from '@/lib/access';
import { useAction, useApi } from '@/lib/hooks';
import { DEPT_LABEL, DIMENSION_LABEL, dateTime, label, timeAgo } from '@/lib/format';
import { Button, Card, DataTable, ErrorBox, Field, Input, LinkButton, Modal, PageHeader, Select, StatusBadge } from '@/components/ui';

type Issue = {
  id: number; entityType: string; entityId: number; entityLabel: string; message: string; severity: string; department: Department; status: string;
  detectedAt: string; lastSeenAt: string; resolvedAt: string | null; note: string | null;
  rule: { code: string; name: string; dimension: string };
  resolvedBy: { name: string } | null;
};

const FIX_HINT: Record<string, string> = {
  Fisher: 'Master Data → Fishers', Buyer: 'Master Data → Buyers', Lot: 'Cold Storage', Landing: 'Landing & Grading', LandingItem: 'Landing & Grading',
  TemperatureLog: 'Cold Storage', StorageUnit: 'Cold Storage', SalesOrderItem: 'Sales', DispatchItem: 'Logistics', Invoice: 'Finance',
};
const FIX_LINK: Record<string, string> = {
  Fisher: '/master/fishers', Buyer: '/master/buyers', Lot: '/storage', Landing: '/landings', LandingItem: '/landings',
  TemperatureLog: '/storage', StorageUnit: '/storage', SalesOrderItem: '/sales', DispatchItem: '/dispatch', Invoice: '/finance',
};

export default function IssuesPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState('OPEN');
  const [department, setDepartment] = useState('');
  const isAdmin = user?.department === 'ADMIN';
  const [dimension, setDimension] = useState('');
  const [ruleCode, setRuleCode] = useState('');
  const [editing, setEditing] = useState<{ issue: Issue; status: string } | null>(null);

  // Allow links like /dq/issues#DQ-08 from the dashboard.
  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (/^DQ-\d+$/.test(hash)) setRuleCode(hash);
  }, []);

  const qs = new URLSearchParams({ status, ...(department && { department }), ...(dimension && { dimension }), ...(ruleCode && { ruleCode }) });
  const { data, error, reload } = useApi<Issue[]>(`/dq/issues?${qs}`);
  const canEdit = (i: Issue) => user?.department === 'ADMIN' || user?.department === i.department;

  return (
    <>
      <PageHeader
        title={isAdmin ? 'Data Quality Issue Queue' : 'My Data Quality Issues'}
        subtitle={
          isAdmin
            ? 'Every rule failure becomes an issue assigned to the department that owns the data. Issues close automatically once the data is fixed and the rule passes again.'
            : `Data problems in records owned by ${user ? DEPT_LABEL[user.department] : 'your department'}. Fix the data and the issue closes by itself.`
        }
      />
      <ErrorBox error={error} />
      <Card className="mb-4">
        <div className={`grid gap-3 sm:grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="OPEN">Open</option>
              <option value="RESOLVED">Resolved</option>
              <option value="IGNORED">Ignored</option>
              <option value="ALL">All</option>
            </Select>
          </Field>
          {isAdmin && (
            <Field label="Department (owner)">
              <Select value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="">All departments</option>
                {Object.entries(DEPT_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Dimension">
            <Select value={dimension} onChange={(e) => setDimension(e.target.value)}>
              <option value="">All dimensions</option>
              {Object.entries(DIMENSION_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Rule">
            <Select value={ruleCode} onChange={(e) => setRuleCode(e.target.value)}>
              <option value="">All rules</option>
              {Array.from({ length: 15 }, (_, i) => `DQ-${String(i + 1).padStart(2, '0')}`).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>
      <Card padded={false} title={data ? `${data.length} issue${data.length === 1 ? '' : 's'}` : 'Issues'}>
        <DataTable
          rows={data}
          rowKey={(i) => i.id}
          empty="No issues match these filters. ✓"
          columns={[
            { header: 'Rule', cell: (i) => <><p className="font-mono text-xs text-slate-500">{i.rule.code} · {DIMENSION_LABEL[i.rule.dimension]}</p><p className="font-medium text-slate-800">{i.rule.name}</p></> },
            { header: 'Severity', cell: (i) => <StatusBadge status={i.severity} /> },
            { header: 'Record', cell: (i) => <><p className="font-medium">{i.entityLabel}</p><p className="text-xs text-slate-500">{label(i.entityType)} #{i.entityId}</p></> },
            { header: 'Problem', className: 'min-w-64', cell: (i) => <><p>{i.message}</p>{i.note && <p className="mt-1 text-xs italic text-slate-500">Note: {i.note}{i.resolvedBy && ` — ${i.resolvedBy.name}`}</p>}</> },
            { header: 'Owner', cell: (i) => <><p className="text-sm">{DEPT_LABEL[i.department]}</p>{canAccess(user?.department, FIX_LINK[i.entityType]) && <div className="mt-1.5"><LinkButton size="sm" href={FIX_LINK[i.entityType]}>Fix in {FIX_HINT[i.entityType]}</LinkButton></div>}</> },
            { header: 'Detected', cell: (i) => <span title={dateTime(i.detectedAt)}>{timeAgo(i.detectedAt)}</span> },
            { header: 'Status', cell: (i) => <StatusBadge status={i.status} /> },
            {
              header: '',
              className: 'text-right whitespace-nowrap',
              cell: (i) =>
                canEdit(i) &&
                (i.status === 'OPEN' ? (
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="secondary" onClick={() => setEditing({ issue: i, status: 'RESOLVED' })}>Resolve</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing({ issue: i, status: 'IGNORED' })}>Ignore</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setEditing({ issue: i, status: 'OPEN' })}>Reopen</Button>
                )),
            },
          ]}
        />
      </Card>
      {editing && <IssueModal {...editing} onClose={() => setEditing(null)} onSaved={reload} />}
    </>
  );
}

function IssueModal({ issue, status, onClose, onSaved }: { issue: Issue; status: string; onClose: () => void; onSaved: () => void }) {
  const [note, setNote] = useState('');
  const { run, busy } = useAction();
  async function save() {
    if (await run(() => api(`/dq/issues/${issue.id}`, { method: 'PATCH', body: { status, note } }), `Issue ${status.toLowerCase()}`)) {
      onSaved();
      onClose();
    }
  }
  const verb = status === 'RESOLVED' ? 'Resolve' : status === 'IGNORED' ? 'Ignore' : 'Reopen';
  return (
    <Modal
      open
      onClose={onClose}
      title={`${verb} issue · ${issue.rule.code}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy || (status !== 'OPEN' && !note.trim())}>
            {verb}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">
        <strong>{issue.entityLabel}</strong>: {issue.message}
      </p>
      {status === 'RESOLVED' && <p className="text-xs text-slate-500">Tip: fixing the data itself is better — the issue closes automatically when the rule passes. If the data still breaks the rule, the next scan will reopen it.</p>}
      {status === 'IGNORED' && <p className="text-xs text-slate-500">Ignored issues are accepted exceptions: scans will not reopen them.</p>}
      {status !== 'OPEN' && (
        <Field label="Note (required)">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was done / why it is acceptable" autoFocus />
        </Field>
      )}
    </Modal>
  );
}
