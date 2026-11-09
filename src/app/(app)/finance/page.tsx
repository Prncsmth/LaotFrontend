'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAction, useApi } from '@/lib/hooks';
import { date, dateTime, kg, peso } from '@/lib/format';
import { Badge, Button, Card, DataTable, ErrorBox, Field, Input, Modal, PageHeader, Segmented, Select, Stat, StatusBadge } from '@/components/ui';

type Settlement = {
  id: number; settlementNo: string; status: string; totalNetKg: number; grossAmount: string; portFee: string; iceFee: string; netAmount: string; createdAt: string;
  fisher: { name: string; tin: string | null; payoutMethod: string | null; payoutAccount: string | null };
  landing: { landingNo: string; vessel: { name: string } };
};
type Invoice = {
  id: number; invoiceNo: string; status: string; total: string; amountPaid: string; issuedAt: string; dueAt: string;
  buyer: { businessName: string };
  salesOrder: { orderNo: string };
  items: { id: number; description: string; weightKg: number; pricePerKg: string; amount: string }[];
  payments: { id: number; amount: string; method: string; reference: string | null; paidAt: string }[];
};

export default function FinancePage() {
  const { can } = useAuth();
  const settlements = useApi<Settlement[]>('/settlements');
  const invoices = useApi<Invoice[]>('/invoices');
  const [tab, setTab] = useState<'settlements' | 'invoices'>('settlements');
  const [paying, setPaying] = useState<Invoice | null>(null);
  const { run, busy } = useAction();

  const payable = settlements.data?.filter((s) => s.status !== 'PAID').reduce((s, x) => s + Number(x.netAmount), 0) ?? 0;
  const receivable = invoices.data?.reduce((s, i) => s + Number(i.total) - Number(i.amountPaid), 0) ?? 0;

  async function act(s: Settlement, action: 'approve' | 'pay') {
    if (await run(() => api(`/settlements/${s.id}/${action}`, { body: {} }), action === 'approve' ? `${s.settlementNo} approved` : `${s.settlementNo} paid — Port Ops notified`)) settlements.reload();
  }

  return (
    <>
      <PageHeader
        title="Finance"
        subtitle="Fisher settlements are drafted automatically when QC finishes grading; buyer invoices are issued automatically on delivery. DQ-01 blocks paying a fisher without a TIN and payout details."
      />
      <ErrorBox error={settlements.error ?? invoices.error} />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat icon="person" label="Owed to fishers" value={peso(payable)} sub="draft + approved settlements" />
        <Stat icon="building" label="Receivable from buyers" value={peso(receivable)} sub="unpaid invoice balances" />
        <Stat icon="alert" label="Invoices with DQ-11 mismatch" value={invoices.data?.filter(mismatch).length ?? '—'} tone={invoices.data?.some(mismatch) ? 'bad' : 'good'} />
      </div>
      <div className="mb-4">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'settlements', label: 'Fisher settlements' },
            { value: 'invoices', label: 'Buyer invoices' },
          ]}
        />
      </div>

      {tab === 'settlements' ? (
        <Card padded={false}>
          <DataTable
            rows={settlements.data}
            rowKey={(s) => s.id}
            empty="No settlements yet."
            columns={[
              { header: 'Settlement', cell: (s) => <><p className="font-medium text-slate-900">{s.settlementNo}</p><p className="text-xs text-slate-500">{s.landing.landingNo} · {s.landing.vessel.name}</p></> },
              {
                header: 'Fisher',
                cell: (s) => (
                  <>
                    <p>{s.fisher.name}</p>
                    <p className="text-xs text-slate-500">
                      {s.fisher.payoutMethod ?? <span className="text-red-700">no payout method</span>} {s.fisher.payoutAccount ?? ''} · TIN {s.fisher.tin ?? <span className="text-red-700">missing</span>}
                    </p>
                  </>
                ),
              },
              { header: 'Net kg', cell: (s) => kg(s.totalNetKg) },
              {
                header: 'Computation',
                cell: (s) => (
                  <p className="text-xs text-slate-600">
                    Gross {peso(s.grossAmount)} − port fee {peso(s.portFee)} − ice {peso(s.iceFee)}
                  </p>
                ),
              },
              { header: 'Net pay', className: 'text-right', cell: (s) => <span className="font-semibold tabular-nums">{peso(s.netAmount)}</span> },
              { header: 'Status', cell: (s) => <StatusBadge status={s.status} /> },
              {
                header: '',
                className: 'text-right',
                cell: (s) =>
                  can('FINANCE') &&
                  (s.status === 'DRAFT' ? (
                    <Button size="sm" disabled={busy} onClick={() => act(s, 'approve')}>Approve</Button>
                  ) : s.status === 'APPROVED' ? (
                    <Button size="sm" disabled={busy} onClick={() => act(s, 'pay')}>Mark paid</Button>
                  ) : null),
              },
            ]}
          />
        </Card>
      ) : (
        <Card padded={false}>
          <DataTable
            rows={invoices.data}
            rowKey={(i) => i.id}
            empty="No invoices yet."
            columns={[
              { header: 'Invoice', cell: (i) => <><p className="font-medium text-slate-900">{i.invoiceNo}</p><p className="text-xs text-slate-500">{i.salesOrder.orderNo} · {date(i.issuedAt)}</p></> },
              { header: 'Buyer', cell: (i) => i.buyer.businessName },
              {
                header: 'Lines (billed on delivered weight)',
                cell: (i) => (
                  <ul className="space-y-0.5 text-xs">
                    {i.items.map((it) => (
                      <li key={it.id}>
                        {it.description}: {kg(it.weightKg)} × {peso(it.pricePerKg)} = {peso(it.amount)}
                      </li>
                    ))}
                  </ul>
                ),
              },
              {
                header: 'Total',
                className: 'text-right',
                cell: (i) => (
                  <>
                    <p className="font-semibold tabular-nums">{peso(i.total)}</p>
                    {mismatch(i) && <Badge tone="red">≠ lines · DQ-11</Badge>}
                    <p className="text-xs text-slate-500">paid {peso(i.amountPaid)}</p>
                  </>
                ),
              },
              { header: 'Status', cell: (i) => <><StatusBadge status={i.status} /><p className="mt-1 text-xs text-slate-500">due {date(i.dueAt)}</p></> },
              { header: '', className: 'text-right', cell: (i) => can('FINANCE') && i.status !== 'PAID' && <Button size="sm" onClick={() => setPaying(i)}>Record payment</Button> },
            ]}
          />
        </Card>
      )}
      {paying && <PaymentModal invoice={paying} onClose={() => setPaying(null)} onSaved={invoices.reload} />}
    </>
  );
}

function mismatch(i: Invoice) {
  return Math.abs(i.items.reduce((s, x) => s + Number(x.amount), 0) - Number(i.total)) > 0.01;
}

function PaymentModal({ invoice, onClose, onSaved }: { invoice: Invoice; onClose: () => void; onSaved: () => void }) {
  const balance = Number(invoice.total) - Number(invoice.amountPaid);
  const [amount, setAmount] = useState(String(Math.round(balance * 100) / 100));
  const [method, setMethod] = useState('Bank transfer');
  const [reference, setReference] = useState('');
  const { run, busy } = useAction();
  async function save() {
    if (await run(() => api(`/invoices/${invoice.id}/payments`, { body: { amount: Number(amount), method, reference } }), 'Payment recorded')) {
      onSaved();
      onClose();
    }
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={`Record payment · ${invoice.invoiceNo}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy}>
            Save payment
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">
        {invoice.buyer.businessName} · balance <strong>{peso(balance)}</strong>
      </p>
      {invoice.payments.length > 0 && (
        <ul className="text-xs text-slate-500">
          {invoice.payments.map((p) => (
            <li key={p.id}>
              {dateTime(p.paidAt)} · {peso(p.amount)} · {p.method} {p.reference}
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Amount (₱)">
          <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Method">
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option>Bank transfer</option>
            <option>GCash</option>
            <option>Cash</option>
            <option>Check</option>
          </Select>
        </Field>
      </div>
      <Field label="Reference no. (optional)">
        <Input value={reference} onChange={(e) => setReference(e.target.value)} />
      </Field>
    </Modal>
  );
}
