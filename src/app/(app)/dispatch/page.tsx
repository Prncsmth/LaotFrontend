'use client';

import { useState } from 'react';
import { FlightBoard } from '@/components/FlightBoard';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAction, useApi } from '@/lib/hooks';
import { dateTime, kg } from '@/lib/format';
import { Badge, Button, Card, DataTable, ErrorBox, Field, Input, Modal, PageHeader, Select, StatusBadge } from '@/components/ui';

type Item = { id: number; orderedKg: number; weightOutKg: number | null; lot: { lotNo: string; grade: string; species: { name: string; shrinkageTolerancePct: number } } };
type Dispatch = {
  id: number; dispatchNo: string; status: string; createdAt: string; departedAt: string | null; deliveredAt: string | null;
  truck: { plateNo: string } | null;
  salesOrder: { orderNo: string; buyer: { businessName: string; address: string | null } };
  items: Item[];
};
type Truck = { id: number; plateNo: string; capacityKg: number; isReefer: boolean };

const shrink = (i: Item) => (i.weightOutKg == null ? null : ((i.orderedKg - i.weightOutKg) / i.orderedKg) * 100);

export default function DispatchPage() {
  const { can } = useAuth();
  const { data, error, reload } = useApi<Dispatch[]>('/dispatches');
  // bump the board too, so it shows the change right away
  const [version, setVersion] = useState(0);
  const refresh = () => {
    reload();
    setVersion((v) => v + 1);
  };
  const [depart, setDepart] = useState<Dispatch | null>(null);
  const [deliver, setDeliver] = useState<Dispatch | null>(null);

  return (
    <>
      <PageHeader
        title="Logistics"
        subtitle="Dispatches are created automatically when Sales confirms an order. Assign a reefer truck, then record the actual delivered weight — the loss is checked against the species' shrinkage tolerance (DQ-10) and Finance invoices the delivered weight."
      />
      <ErrorBox error={error} />
      <div className="mb-6">
        <FlightBoard type="departures" take={10} version={version} />
      </div>
      <Card padded={false}>
        <DataTable
          rows={data}
          rowKey={(d) => d.id}
          empty="No dispatches yet."
          columns={[
            { header: 'Dispatch', cell: (d) => <><p className="font-medium text-slate-900">{d.dispatchNo}</p><p className="text-xs text-slate-500">{d.salesOrder.orderNo}</p></> },
            { header: 'Buyer', cell: (d) => d.salesOrder.buyer.businessName },
            {
              header: 'Items (ordered → delivered)',
              cell: (d) => (
                <ul className="space-y-0.5 text-xs">
                  {d.items.map((i) => {
                    const s = shrink(i);
                    const bad = s != null && s > i.lot.species.shrinkageTolerancePct;
                    return (
                      <li key={i.id}>
                        {i.lot.lotNo} · {i.lot.species.name} {i.lot.grade} · {kg(i.orderedKg)}
                        {i.weightOutKg != null && (
                          <>
                            {' → '}
                            {kg(i.weightOutKg)}{' '}
                            <span className={bad ? 'font-semibold text-amber-700' : 'text-slate-500'}>
                              ({s!.toFixed(1)}% loss{bad ? `, over ${i.lot.species.shrinkageTolerancePct}% — DQ-10` : ''})
                            </span>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ),
            },
            { header: 'Truck', cell: (d) => d.truck?.plateNo ?? '—' },
            { header: 'Status', cell: (d) => <><StatusBadge status={d.status} /><p className="mt-1 text-xs text-slate-500">{dateTime(d.deliveredAt ?? d.departedAt ?? d.createdAt)}</p></> },
            {
              header: '',
              className: 'text-right',
              cell: (d) =>
                can('SALES') &&
                (d.status === 'PENDING' ? (
                  <Button size="sm" onClick={() => setDepart(d)}>Assign truck</Button>
                ) : d.status === 'IN_TRANSIT' ? (
                  <Button size="sm" onClick={() => setDeliver(d)}>Record delivery</Button>
                ) : null),
            },
          ]}
        />
      </Card>
      {depart && <DepartModal dispatch={depart} onClose={() => setDepart(null)} onSaved={refresh} />}
      {deliver && <DeliverModal dispatch={deliver} onClose={() => setDeliver(null)} onSaved={refresh} />}
    </>
  );
}

function DepartModal({ dispatch, onClose, onSaved }: { dispatch: Dispatch; onClose: () => void; onSaved: () => void }) {
  const { data: trucks } = useApi<Truck[]>('/trucks');
  const [truckId, setTruckId] = useState('');
  const { run, busy } = useAction();
  const total = dispatch.items.reduce((s, i) => s + i.orderedKg, 0);
  async function save() {
    if (await run(() => api(`/dispatches/${dispatch.id}/depart`, { body: { truckId: Number(truckId) } }), `${dispatch.dispatchNo} is on the way`)) {
      onSaved();
      onClose();
    }
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={`Assign truck · ${dispatch.dispatchNo}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy || !truckId}>
            Depart
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">Load: {kg(total)} for {dispatch.salesOrder.buyer.businessName}.</p>
      <Field label="Truck" hint="Seafood must go in a refrigerated (reefer) truck with enough capacity.">
        <Select value={truckId} onChange={(e) => setTruckId(e.target.value)}>
          <option value="">Select truck…</option>
          {trucks?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.plateNo} · {kg(t.capacityKg)} {t.isReefer ? '· reefer' : '· NOT refrigerated'}
            </option>
          ))}
        </Select>
      </Field>
    </Modal>
  );
}

function DeliverModal({ dispatch, onClose, onSaved }: { dispatch: Dispatch; onClose: () => void; onSaved: () => void }) {
  const [weights, setWeights] = useState<Record<number, string>>(() => Object.fromEntries(dispatch.items.map((i) => [i.id, String(i.orderedKg)])));
  const { run, busy } = useAction();
  async function save() {
    const items = dispatch.items.map((i) => ({ itemId: i.id, weightOutKg: Number(weights[i.id]) }));
    if (await run(() => api(`/dispatches/${dispatch.id}/deliver`, { body: { items } }), 'Delivered — Finance has issued the invoice')) {
      onSaved();
      onClose();
    }
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={`Record delivery · ${dispatch.dispatchNo}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy}>
            Confirm delivery
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">Enter the weight actually received by the buyer for each lot.</p>
      {dispatch.items.map((i) => {
        const w = Number(weights[i.id]);
        const loss = ((i.orderedKg - w) / i.orderedKg) * 100;
        const over = loss > i.lot.species.shrinkageTolerancePct;
        return (
          <Field
            key={i.id}
            label={`${i.lot.lotNo} · ${i.lot.species.name} ${i.lot.grade} (ordered ${kg(i.orderedKg)})`}
            hint={
              weights[i.id] !== '' && (
                <>
                  Loss {loss.toFixed(1)}% · tolerance {i.lot.species.shrinkageTolerancePct}% {over && <Badge tone="amber">DQ-10 will warn</Badge>}
                </>
              )
            }
          >
            <Input type="number" min="0" step="0.01" value={weights[i.id]} onChange={(e) => setWeights({ ...weights, [i.id]: e.target.value })} />
          </Field>
        );
      })}
    </Modal>
  );
}
