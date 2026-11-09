'use client';

import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAction, useApi } from '@/lib/hooks';
import { DEPT_LABEL, DIMENSION_LABEL, dateTime, timeAgo } from '@/lib/format';
import { Badge, Button, Card, ErrorBox, LinkButton, Loading, Meter, PageHeader, ScoreStatus, StatusBadge } from '@/components/ui';
import { ScoreTrend } from '@/components/ScoreTrend';
import type { Department } from '@/lib/api';

type Score = { scope: string; score: number; totalRecords: number; failingRecords: number };
type Summary = {
  scores: Score[];
  history: { date: string; scope: string; score: number; totalRecords: number; failingRecords: number }[];
  topRules: { code: string; name: string; open: number }[];
  openByDepartment: { department: Department; severity: string; open: number }[];
  recent: { id: number; entityLabel: string; message: string; severity: string; department: Department; detectedAt: string; rule: { code: string; name: string } }[];
  lastScanAt: string | null;
};

const DIMENSION_HELP: Record<string, string> = {
  COMPLETENESS: 'required fields are filled',
  VALIDITY: 'values follow the right format',
  ACCURACY: 'values are realistic and correct',
  UNIQUENESS: 'no duplicates, nothing sold twice',
  CONSISTENCY: 'departments’ numbers agree',
  TIMELINESS: 'data is fresh and on time',
};

export default function DqDashboard() {
  const { can } = useAuth();
  const { data, error, reload } = useApi<Summary>('/dq/summary');
  const { run, busy } = useAction();

  async function scan() {
    const r: any = await run(() => api('/dq/scan', { body: {} }), 'Full data quality scan finished');
    if (r) reload();
  }

  const overall = data?.scores.find((s) => s.scope === 'OVERALL');
  const depts = data?.scores.filter((s) => s.scope in DEPT_LABEL) ?? [];
  const dims = data?.scores.filter((s) => s.scope in DIMENSION_LABEL) ?? [];
  const trend = data?.history.filter((h) => h.scope === 'OVERALL').map((h) => ({ date: h.date, score: h.score, failing: h.failingRecords, total: h.totalRecords })) ?? [];

  return (
    <>
      <PageHeader
        title="Data Quality Dashboard"
        subtitle="Every record checked by the 15 DQ rules. Score = share of records with no open data quality issue."
        actions={
          <>
            <Link href="/dq/issues">
              <Button variant="secondary">Issue queue</Button>
            </Link>
            {can('ADMIN') && (
              <Button onClick={scan} disabled={busy}>
                {busy ? 'Scanning…' : 'Run full scan now'}
              </Button>
            )}
          </>
        }
      />
      <ErrorBox error={error} />
      {!data || !overall ? (
        <Loading />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card title="Overall data quality">
              <p className="text-5xl font-semibold tabular-nums text-slate-900">{overall.score}%</p>
              <div className="mt-2">
                <ScoreStatus score={overall.score} />
              </div>
              <p className="mt-3 text-sm text-slate-600">
                {overall.failingRecords} of {overall.totalRecords} checked records have an open issue.
              </p>
              <p className="mt-1 text-xs text-slate-500">Last scan {data.lastScanAt ? `${timeAgo(data.lastScanAt)} (${dateTime(data.lastScanAt)})` : 'never'} · automatic every 15 minutes</p>
            </Card>
            <Card title="Overall score by day" className="lg:col-span-2">
              {trend.length ? <ScoreTrend points={trend} /> : <p className="text-sm text-slate-500">No scans yet.</p>}
              {trend.length === 1 && <p className="mt-2 text-xs text-slate-500">One snapshot is saved per day; the trend fills in as scans run on later days.</p>}
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="By department (data owner)">
              <div className="space-y-3.5">
                {depts
                  .sort((a, b) => a.score - b.score)
                  .map((s) => (
                    <Meter key={s.scope} value={s.score} label={DEPT_LABEL[s.scope as Department]} right={<span>{s.score}% <span className="text-xs font-normal text-slate-500">({s.failingRecords}/{s.totalRecords})</span></span>} />
                  ))}
              </div>
            </Card>
            <Card title="By dimension">
              <div className="space-y-3.5">
                {dims.map((s) => (
                  <Meter
                    key={s.scope}
                    value={s.score}
                    label={<span>{DIMENSION_LABEL[s.scope]} <span className="text-xs text-slate-500">— {DIMENSION_HELP[s.scope]}</span></span>}
                    right={<span>{s.score}% <span className="text-xs font-normal text-slate-500">({s.failingRecords}/{s.totalRecords})</span></span>}
                  />
                ))}
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Rules failing most often" actions={<LinkButton size="sm" href="/dq/rules">All rules</LinkButton>}>
              {data.topRules.length === 0 ? (
                <p className="text-sm text-slate-500">No open issues. ✓</p>
              ) : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {data.topRules.map((r) => (
                    <li key={r.code} className="flex items-center justify-between py-2">
                      <Link href={`/dq/issues#${r.code}`} className="hover:text-cyan-800">
                        <span className="font-mono text-xs text-slate-500">{r.code}</span> {r.name}
                      </Link>
                      <Badge tone="red">{r.open} open</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title="Newest issues" actions={<LinkButton size="sm" href="/dq/issues">Issue queue</LinkButton>}>
              <ul className="divide-y divide-slate-100 text-sm">
                {data.recent.map((i) => (
                  <li key={i.id} className="py-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={i.severity} />
                      <span className="font-mono text-xs text-slate-500">{i.rule.code}</span>
                      <span className="font-medium">{i.entityLabel}</span>
                      <span className="text-xs text-slate-400">· {DEPT_LABEL[i.department]}</span>
                    </div>
                    <p className="text-slate-600">{i.message}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
