'use client';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAction, useApi } from '@/lib/hooks';
import { label } from '@/lib/format';
import { Button, Card, DataTable, ErrorBox, PageHeader } from '@/components/ui';

type Change = { entity: string; id: number; label: string; field: string; before: string | null; after: string | null };

export default function CleansingPage() {
  const { can } = useAuth();
  const { data, error, reload } = useApi<Change[]>('/dq/cleansing');
  const { run, busy } = useAction();

  async function apply() {
    if (!confirm(`Apply ${data?.length} standardization change(s)? Every change is recorded in the audit trail.`)) return;
    if (await run(() => api('/dq/cleansing/apply', { body: {} }), 'Records standardized and re-scanned')) reload();
  }

  return (
    <>
      <PageHeader
        title="Standardization"
        subtitle="New data is cleaned automatically when saved (names in Title Case, phones as 09XXXXXXXXX, TIN as XXX-XXX-XXX-XXX, extra spaces removed). This page finds older records saved before these rules and fixes them in one click."
        actions={can('ADMIN') && !!data?.length && <Button onClick={apply} disabled={busy}>Apply all {data.length} changes</Button>}
      />
      <ErrorBox error={error} />
      <Card padded={false} title={data ? `${data.length} pending change${data.length === 1 ? '' : 's'}` : 'Pending changes'}>
        <DataTable
          rows={data}
          rowKey={(c) => `${c.entity}-${c.id}-${c.field}`}
          empty="✓ All records already follow the standard format."
          columns={[
            { header: 'Record', cell: (c) => <><p className="font-medium">{c.label}</p><p className="text-xs text-slate-500">{c.entity} #{c.id}</p></> },
            { header: 'Field', cell: (c) => label(c.field.replace(/([A-Z])/g, '_$1')) },
            { header: 'Before', cell: (c) => <code className="rounded bg-red-50 px-1.5 py-0.5 text-red-800 whitespace-pre">{JSON.stringify(c.before)}</code> },
            { header: 'After', cell: (c) => <code className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-800">{JSON.stringify(c.after)}</code> },
          ]}
        />
      </Card>
    </>
  );
}
