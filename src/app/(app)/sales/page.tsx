'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAction, useApi } from '@/lib/hooks';
import { dateTime, kg, peso, timeAgo } from '@/lib/format';
import { Button, Card, DataTable, ErrorBox, Field, Input, Modal, PageHeader, Select, StatusBadge } from '@/components/ui';

type Species = { name: string; minSellPricePerKg: string; maxSellPricePerKg: string };
type Lot = { id: number; lotNo: string; grade: string; availableKg: number; netWeightKg: number; expiresAt: string; status: string; species: Species; storageUnit: { code: string } | null };
type Buyer = { id: number; businessName: string; status: string };
type Order = {
  id: number; orderNo: string; status: string; createdAt: string;
  buyer: { businessName: string };
  createdBy: { name: string } | null;
  items: { id: number; weightKg: number; pricePerKg: string; lot: { lotNo: string; grade: string; species: Species } }[];
  dispatch: { dispatchNo: string; status: string } | null;
  invoice: { invoiceNo: string; status: string } | null;
};

export default function SalesPage() {
  const { can } = useAuth();
  const lots = useApi<Lot[]>('/lots?status=IN_STORAGE');
  const orders = useApi<Order[]>('/sales-orders');
  const [showNew, setShowNew] = useState(false);
  const { run, busy } = useAction();
  const reload = () => {
    lots.reload();
    orders.reload();
  };

  async function cancel(o: Order) {
    if (!confirm(`Cancel ${o.orderNo}? Reserved weight goes back to stock.`)) return;
    if (await run(() => api(`/sales-orders/${o.id}/cancel`, { body: {} }), `${o.orderNo} cancelled`)) reload();
  }

  return (
    <>
      <PageHeader
        title="Sales"
        subtitle="Sell lots that Cold Storage has made available. Confirming an order reserves the weight (DQ-09 prevents over-selling) and sends it to Logistics automatically."
        actions={can('SALES') && <Button icon="plus" onClick={() => setShowNew(true)}>New order</Button>}
      />
      <ErrorBox error={lots.error ?? orders.error} />
      <div className="space-y-6">
        <Card title="Available stock" padded={false}>
          <DataTable
            rows={lots.data?.filter((l) => l.availableKg > 0)}
            rowKey={(l) => l.id}
            empty="No stock available for sale."
            columns={[
              { header: 'Lot', cell: (l) => <Link href={`/trace#${l.lotNo}`} className="font-medium text-cyan-800 hover:underline">{l.lotNo}</Link> },
              { header: 'Species', cell: (l) => `${l.species.name} · Grade ${l.grade}` },
              { header: 'Available', cell: (l) => <span className="tabular-nums">{kg(l.availableKg)}</span> },
              { header: 'Price range / kg', cell: (l) => `${peso(l.species.minSellPricePerKg)} – ${peso(l.species.maxSellPricePerKg)}` },
              { header: 'Unit', cell: (l) => l.storageUnit?.code ?? '—' },
              { header: 'Expires', cell: (l) => <span title={dateTime(l.expiresAt)}>{timeAgo(l.expiresAt)}</span> },
            ]}
          />
        </Card>
        <Card title="Sales orders" padded={false}>
          <DataTable
            rows={orders.data}
            rowKey={(o) => o.id}
            empty="No orders yet."
            columns={[
              { header: 'Order', cell: (o) => <><p className="font-medium text-slate-900">{o.orderNo}</p><p className="text-xs text-slate-500">{dateTime(o.createdAt)}</p></> },
              { header: 'Buyer', cell: (o) => o.buyer.businessName },
              {
                header: 'Items',
                cell: (o) => (
                  <ul className="space-y-0.5 text-xs">
                    {o.items.map((i) => {
                      const out = Number(i.pricePerKg) < Number(i.lot.species.minSellPricePerKg) || Number(i.pricePerKg) > Number(i.lot.species.maxSellPricePerKg);
                      return (
                        <li key={i.id}>
                          {i.lot.lotNo} · {i.lot.species.name} {i.lot.grade} · {kg(i.weightKg)} @ <span className={out ? 'font-semibold text-amber-700' : ''}>{peso(i.pricePerKg)}</span>
                          {out && <span className="text-amber-700"> (DQ-06)</span>}
                        </li>
                      );
                    })}
                  </ul>
                ),
              },
              { header: 'Total', className: 'text-right', cell: (o) => <span className="tabular-nums">{peso(o.items.reduce((s, i) => s + i.weightKg * Number(i.pricePerKg), 0))}</span> },
              { header: 'Status', cell: (o) => <div className="space-y-1"><StatusBadge status={o.status} />{o.dispatch && <p className="text-xs text-slate-500">{o.dispatch.dispatchNo}</p>}{o.invoice && <p className="text-xs text-slate-500">{o.invoice.invoiceNo}</p>}</div> },
              {
                header: '',
                className: 'text-right',
                cell: (o) => can('SALES') && o.status === 'CONFIRMED' && o.dispatch?.status === 'PENDING' && <Button size="sm" variant="secondary" disabled={busy} onClick={() => cancel(o)}>Cancel</Button>,
              },
            ]}
          />
        </Card>
      </div>
      {showNew && lots.data && <NewOrderModal lots={lots.data.filter((l) => l.availableKg > 0)} onClose={() => setShowNew(false)} onSaved={reload} />}
    </>
  );
}

function NewOrderModal({ lots, onClose, onSaved }: { lots: Lot[]; onClose: () => void; onSaved: () => void }) {
  const { data: buyers } = useApi<Buyer[]>('/buyers?status=ACTIVE');
  const [buyerId, setBuyerId] = useState('');
  const [items, setItems] = useState([{ lotId: '', weightKg: '', pricePerKg: '' }]);
  const { run, busy } = useAction();
  const lotById = new Map(lots.map((l) => [String(l.id), l]));
  const total = items.reduce((s, i) => s + (Number(i.weightKg) || 0) * (Number(i.pricePerKg) || 0), 0);

  const setItem = (idx: number, patch: Partial<(typeof items)[number]>) => setItems(items.map((x, i) => (i === idx ? { ...x, ...patch } : x)));

  async function save() {
    const r = await run(
      () => api('/sales-orders', { body: { buyerId: Number(buyerId), items: items.map((i) => ({ lotId: Number(i.lotId), weightKg: Number(i.weightKg), pricePerKg: Number(i.pricePerKg) })) } }),
      'Order confirmed — Logistics has been notified',
    );
    if (r) {
      onSaved();
      onClose();
    }
  }

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title="New sales order"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy || !buyerId}>
            Confirm order · {peso(total)}
          </Button>
        </>
      }
    >
      <Field label="Buyer">
        <Select value={buyerId} onChange={(e) => setBuyerId(e.target.value)}>
          <option value="">Select buyer…</option>
          {buyers?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.businessName}
            </option>
          ))}
        </Select>
      </Field>
      <div className="space-y-2">
        {items.map((it, idx) => {
          const lot = lotById.get(it.lotId);
          const price = Number(it.pricePerKg);
          const outOfRange = lot && it.pricePerKg !== '' && (price < Number(lot.species.minSellPricePerKg) || price > Number(lot.species.maxSellPricePerKg));
          const over = lot && Number(it.weightKg) > lot.availableKg;
          return (
            <div key={idx} className="rounded-lg border border-slate-200 p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_8rem_8rem_auto]">
                <Select
                  value={it.lotId}
                  onChange={(e) => {
                    const l = lotById.get(e.target.value);
                    setItem(idx, { lotId: e.target.value, pricePerKg: l ? String(Math.round((Number(l.species.minSellPricePerKg) + Number(l.species.maxSellPricePerKg)) / 2)) : '' });
                  }}
                >
                  <option value="">Lot…</option>
                  {lots.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.lotNo} · {l.species.name} {l.grade} · {kg(l.availableKg)} free
                    </option>
                  ))}
                </Select>
                <Input type="number" min="0" step="0.01" placeholder="kg" value={it.weightKg} onChange={(e) => setItem(idx, { weightKg: e.target.value })} />
                <Input type="number" min="0" step="0.01" placeholder="₱ / kg" value={it.pricePerKg} onChange={(e) => setItem(idx, { pricePerKg: e.target.value })} />
                <Button variant="ghost" size="sm" onClick={() => setItems(items.filter((_, i) => i !== idx))} disabled={items.length === 1} aria-label="Remove line">
                  ✕
                </Button>
              </div>
              {lot && (
                <p className="mt-1.5 text-xs text-slate-500">
                  Allowed price {peso(lot.species.minSellPricePerKg)} – {peso(lot.species.maxSellPricePerKg)} per kg
                  {outOfRange && <span className="font-medium text-amber-700"> · outside range, DQ-06 will warn</span>}
                  {over && <span className="font-medium text-red-700"> · more than available, DQ-09 will block</span>}
                </p>
              )}
            </div>
          );
        })}
        <Button variant="ghost" size="sm" onClick={() => setItems([...items, { lotId: '', weightKg: '', pricePerKg: '' }])}>
          + Add lot
        </Button>
      </div>
    </Modal>
  );
}
