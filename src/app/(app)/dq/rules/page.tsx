'use client';

import { useState } from 'react';
import { api, type Department } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAction, useApi } from '@/lib/hooks';
import { DEPT_LABEL, DIMENSION_LABEL, label } from '@/lib/format';
import { Badge, Button, Card, ErrorBox, Input, Loading, PageHeader, Switch } from '@/components/ui';

type Rule = {
  id: number; code: string; name: string; description: string; dimension: string; entityType: string;
  severity: 'BLOCK' | 'WARN'; ownerDepartment: Department; params: Record<string, number>; isActive: boolean; checkMode: string; openIssues: number;
};

const MODE_HELP: Record<string, string> = {
  REALTIME: 'checked when the record is saved',
  EVENT: 'checked at a workflow step (approval, delivery)',
  BATCH: 'checked by the scheduled scan',
};
const PARAM_LABEL: Record<string, string> = { minC: 'Min °C', maxC: 'Max °C', threshold: 'Similarity (0–1)', hours: 'Hours' };

export default function RulesPage() {
  const { can } = useAuth();
  const { data, error, reload } = useApi<Rule[]>('/dq/rules');
  const { run, busy } = useAction();
  const [params, setParams] = useState<Record<number, Record<string, string>>>({});
  const admin = can('ADMIN');

  async function update(rule: Rule, body: Partial<Pick<Rule, 'severity' | 'isActive'>> & { params?: Record<string, number> }, msg: string) {
    if (await run(() => api(`/dq/rules/${rule.id}`, { method: 'PATCH', body }), msg)) reload();
  }

  return (
    <>
      <PageHeader
        title="Data Quality Rules"
        subtitle="Rules are data, not code: the Admin can switch a rule on or off, change BLOCK ↔ WARN, and tune its thresholds here without a programmer. BLOCK stops the transaction; WARN saves it and opens an issue."
      />
      <ErrorBox error={error} />
      {!data ? (
        <Loading />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.map((r) => (
            <Card
              key={r.id}
              className={r.isActive ? '' : 'opacity-60'}
              title={
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-slate-500">{r.code}</span> {r.name}
                </span>
              }
              actions={r.openIssues > 0 ? <Badge tone="red">{r.openIssues} open</Badge> : <Badge tone="green">✓ 0 open</Badge>}
            >
              <p className="text-sm text-slate-600">{r.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                <Badge tone="blue">{DIMENSION_LABEL[r.dimension]}</Badge>
                <Badge>{r.entityType.split(',').map(label).join(' / ')}</Badge>
                <Badge tone="violet">Owner: {DEPT_LABEL[r.ownerDepartment]}</Badge>
                <Badge>
                  {r.checkMode.toLowerCase()} — {MODE_HELP[r.checkMode]}
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-3">
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-600">Severity</p>
                  <div className="inline-flex rounded-[10px] bg-slate-200/70 p-0.5 text-[13px]">
                    {(['BLOCK', 'WARN'] as const).map((s) => (
                      <button
                        key={s}
                        disabled={!admin || busy}
                        onClick={() => s !== r.severity && update(r, { severity: s }, `${r.code} is now ${s}`)}
                        className={`rounded-lg px-3 py-1 font-medium transition-all ${r.severity === s ? `bg-white shadow-sm ${s === 'BLOCK' ? 'text-red-700' : 'text-amber-700'}` : 'text-slate-500 hover:text-slate-800'} disabled:cursor-not-allowed`}
                      >
                        {s === 'BLOCK' ? 'Block' : 'Warn'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pb-0.5">
                  <Switch checked={r.isActive} disabled={!admin || busy} onChange={(on) => update(r, { isActive: on }, `${r.code} ${on ? 'enabled' : 'disabled'}`)} label="Active" />
                </div>
                {Object.keys(r.params).length > 0 && (
                  <div className="flex flex-wrap items-end gap-2">
                    {Object.entries(r.params).map(([k, v]) => (
                      <label key={k} className="block">
                        <span className="mb-1 block text-xs font-medium text-slate-600">{PARAM_LABEL[k] ?? k}</span>
                        <Input
                          type="number"
                          step="any"
                          className="w-24"
                          disabled={!admin}
                          value={params[r.id]?.[k] ?? String(v)}
                          onChange={(e) => setParams({ ...params, [r.id]: { ...params[r.id], [k]: e.target.value } })}
                        />
                      </label>
                    ))}
                    {admin && params[r.id] && (
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={async () => {
                          const merged = Object.fromEntries(Object.entries(r.params).map(([k, v]) => [k, Number(params[r.id]?.[k] ?? v)]));
                          await update(r, { params: merged }, `${r.code} parameters saved`);
                          setParams(({ [r.id]: _, ...rest }) => rest);
                        }}
                      >
                        Save
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
