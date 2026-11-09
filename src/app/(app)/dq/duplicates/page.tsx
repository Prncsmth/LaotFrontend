'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAction, useApi } from '@/lib/hooks';
import { Badge, Button, Card, ErrorBox, Loading, PageHeader, Segmented } from '@/components/ui';

type Pair = { similarity: number; samePhone: boolean; a: any; b: any };

const FIELDS = {
  fisher: [
    ['name', 'Name'], ['phone', 'Phone'], ['tin', 'TIN'], ['address', 'Address'], ['payoutMethod', 'Payout'], ['payoutAccount', 'Account'],
  ],
  buyer: [
    ['businessName', 'Business'], ['contactPerson', 'Contact'], ['phone', 'Phone'], ['email', 'Email'], ['tin', 'TIN'], ['address', 'Address'],
  ],
} as const;

export default function DuplicatesPage() {
  const { can } = useAuth();
  const [entity, setEntity] = useState<'fisher' | 'buyer'>('fisher');
  const { data, error, reload } = useApi<Pair[]>(`/dq/duplicates?entity=${entity}`);
  const { run, busy } = useAction();

  async function merge(keep: any, dup: any) {
    const name = keep.name ?? keep.businessName;
    if (!confirm(`Keep #${keep.id} "${name}" and merge #${dup.id} into it?\n\nEmpty fields are filled from the duplicate and all its transactions are moved. The duplicate is kept as MERGED (not deleted).`)) return;
    const r: any = await run(() => api(`/${entity}s/${dup.id}/merge`, { body: { keepId: keep.id } }), `Merged #${dup.id} into #${keep.id}`);
    if (r) reload();
  }

  const usage = (r: any) =>
    entity === 'fisher' ? `${r._count.vessels} vessel(s), ${r._count.settlements} settlement(s)` : `${r._count.salesOrders} order(s), ${r._count.invoices} invoice(s)`;

  return (
    <>
      <PageHeader
        title="Duplicates & Merge"
        subtitle="DQ-08 finds records with nearly the same name (PostgreSQL pg_trgm trigram similarity — word order and punctuation don't matter) or the same phone number. Merging keeps one golden record and moves all history to it."
      />
      <ErrorBox error={error} />
      <div className="mb-4">
        <Segmented
          value={entity}
          onChange={setEntity}
          options={[
            { value: 'fisher', label: 'Fishers' },
            { value: 'buyer', label: 'Buyers' },
          ]}
        />
      </div>
      {!data ? (
        <Loading />
      ) : data.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-600">✓ No likely duplicates found.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.map((p) => (
            <Card
              key={`${p.a.id}-${p.b.id}`}
              title={
                <span className="flex flex-wrap items-center gap-2">
                  Possible duplicate <Badge tone="amber">{Math.round(p.similarity * 100)}% name match</Badge>
                  {p.samePhone && <Badge tone="red">same phone</Badge>}
                </span>
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                {[p.a, p.b].map((rec, idx) => {
                  const other = idx === 0 ? p.b : p.a;
                  return (
                    <div key={rec.id} className="rounded-xl bg-slate-50 p-4 ring-1 ring-black/4">
                      <p className="mb-2 text-xs text-slate-500">
                        #{rec.id} · {usage(rec)}
                      </p>
                      <dl className="grid grid-cols-[6rem_1fr] gap-x-2 gap-y-1 text-sm">
                        {FIELDS[entity].map(([k, l]) => (
                          <div key={k} className="contents">
                            <dt className="text-slate-500">{l}</dt>
                            <dd className={rec[k] ? 'text-slate-900' : 'italic text-slate-400'}>{rec[k] ?? 'empty'}</dd>
                          </div>
                        ))}
                      </dl>
                      {can('ADMIN') && (
                        <Button size="sm" className="mt-3" disabled={busy} onClick={() => merge(rec, other)}>
                          Keep this one
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
