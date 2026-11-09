'use client';

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '@/lib/api';
import { useApi } from '@/lib/hooks';
import { dateTime, kg, peso } from '@/lib/format';
import { Badge, Button, Card, ErrorBox, Input, Loading, PageHeader, StatusBadge } from '@/components/ui';
import { EventList } from '@/components/EventList';

type Trace = { lot: any; events: any[]; issues: any[] };

export default function TracePage() {
  const [query, setQuery] = useState('');
  const [trace, setTrace] = useState<Trace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState('');
  const { data: recent } = useApi<{ lotNo: string; species: { name: string }; grade: string; status: string }[]>('/lots');

  const load = useCallback(async (lotNo: string) => {
    if (!lotNo) return;
    setLoading(true);
    setError(null);
    try {
      setTrace(await api<Trace>(`/trace/${encodeURIComponent(lotNo)}`));
      window.history.replaceState(null, '', `#${lotNo}`);
    } catch (e) {
      setTrace(null);
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Lot number comes from the URL hash, e.g. /trace#LOT-261109-0001 (also what the QR code opens).
  useEffect(() => {
    setOrigin(window.location.origin);
    const fromHash = () => {
      const lot = decodeURIComponent(window.location.hash.slice(1));
      if (lot) {
        setQuery(lot);
        load(lot);
      }
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [load]);

  function submit(e: FormEvent) {
    e.preventDefault();
    load(query.trim().toUpperCase());
  }

  const lot = trace?.lot;
  const landing = lot?.landingItem.landing;

  return (
    <>
      <PageHeader title="Lot Traceability" subtitle="Follow one box of fish from the boat to the buyer's invoice — the proof that every department works on the same record." />
      <Card className="mb-6">
        <form onSubmit={submit} className="flex flex-wrap gap-2">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Lot number, e.g. LOT-261109-0001" className="max-w-sm" />
          <Button type="submit" disabled={loading}>
            Trace
          </Button>
        </form>
        {recent && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {recent.slice(0, 10).map((l) => (
              <button key={l.lotNo} onClick={() => { setQuery(l.lotNo); load(l.lotNo); }} className="rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-600 hover:border-cyan-600 hover:text-cyan-800">
                {l.lotNo} · {l.species.name} {l.grade}
              </button>
            ))}
          </div>
        )}
      </Card>
      <ErrorBox error={error} />
      {loading && <Loading />}
      {lot && !loading && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Step n={1} title="Caught & landed" dept="Port Operations">
              <p>
                <strong>{landing.vessel.name}</strong> ({landing.vessel.registrationNo}), owned by <strong>{landing.vessel.owner.name}</strong>
              </p>
              <p>
                {landing.landingNo} · arrived {dateTime(landing.arrivedAt)} · gross {kg(lot.landingItem.grossWeightKg)} of {lot.species.name}
                {landing.receivedBy && ` · received by ${landing.receivedBy.name}`}
              </p>
            </Step>
            <Step n={2} title="Graded" dept="Quality Control">
              <p>
                Grade <strong>{lot.grade}</strong> · net <strong>{kg(lot.netWeightKg)}</strong>
                {lot.gradedBy && ` · graded by ${lot.gradedBy.name}`}
              </p>
              <p>
                Freshness limit {lot.species.maxShelfHours} h → expires <strong>{dateTime(lot.expiresAt)}</strong>
              </p>
            </Step>
            <Step n={3} title="Cold storage" dept="Cold Storage" muted={!lot.storageUnit}>
              {lot.storageUnit ? (
                <>
                  <p>
                    Stored in <strong>{lot.storageUnit.code}</strong> ({lot.storageUnit.minTempC}°C to {lot.storageUnit.maxTempC}°C) {lot.storedAt && `since ${dateTime(lot.storedAt)}`}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {lot.storageUnit.temperatureLogs.slice(0, 12).map((t: any) => {
                      const bad = t.readingC < lot.storageUnit.minTempC || t.readingC > lot.storageUnit.maxTempC;
                      return (
                        <span key={t.id} title={dateTime(t.recordedAt)} className={`rounded px-1.5 text-xs tabular-nums ${bad ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                          {t.readingC}°
                        </span>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p>Not stored yet.</p>
              )}
            </Step>
            <Step n={4} title="Sold & delivered" dept="Sales · Logistics" muted={!lot.orderItems.length}>
              {lot.orderItems.length === 0 ? (
                <p>Not sold yet.</p>
              ) : (
                <ul className="space-y-2">
                  {lot.orderItems.map((oi: any) => (
                    <li key={oi.id}>
                      <p>
                        <strong>{oi.salesOrder.buyer.businessName}</strong> · {oi.salesOrder.orderNo} · {kg(oi.weightKg)} @ {peso(oi.pricePerKg)} <StatusBadge status={oi.salesOrder.status} />
                      </p>
                      {oi.salesOrder.dispatch && (
                        <p className="text-slate-600">
                          {oi.salesOrder.dispatch.dispatchNo} on {oi.salesOrder.dispatch.truck?.plateNo ?? '—'}
                          {oi.dispatchItem?.weightOutKg != null && ` · delivered ${kg(oi.dispatchItem.weightOutKg)} (${(((oi.dispatchItem.orderedKg - oi.dispatchItem.weightOutKg) / oi.dispatchItem.orderedKg) * 100).toFixed(1)}% loss)`}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Step>
            <Step n={5} title="Billed & paid" dept="Finance" muted={!lot.orderItems.some((o: any) => o.salesOrder.invoice) && !landing.settlement}>
              {landing.settlement && (
                <p>
                  Fisher settlement {landing.settlement.settlementNo}: {peso(landing.settlement.netAmount)} to {landing.vessel.owner.name} <StatusBadge status={landing.settlement.status} />
                </p>
              )}
              {lot.orderItems
                .filter((o: any) => o.salesOrder.invoice)
                .map((o: any) => (
                  <p key={o.id}>
                    Invoice {o.salesOrder.invoice.invoiceNo}: {peso(o.salesOrder.invoice.total)}, paid {peso(o.salesOrder.invoice.amountPaid)} <StatusBadge status={o.salesOrder.invoice.status} />
                  </p>
                ))}
            </Step>
          </div>
          <div className="space-y-4">
            <Card title={lot.lotNo}>
              <div className="flex flex-col items-center gap-2">
                {origin && <QRCodeSVG value={`${origin}/trace#${lot.lotNo}`} size={160} />}
                <p className="text-center text-xs text-slate-500">Print on the box label — scanning opens this page.</p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  <StatusBadge status={lot.status} />
                  <Badge>{lot.species.name}</Badge>
                  <Badge>Grade {lot.grade}</Badge>
                </div>
                <p className="text-sm text-slate-600">
                  Reserved {kg(lot.reservedKg)} · delivered {kg(lot.dispatchedKg)}
                </p>
              </div>
            </Card>
            <Card title={`Data quality (${trace!.issues.length})`}>
              {trace!.issues.length === 0 ? (
                <p className="text-sm text-slate-500">✓ No issues recorded for this lot.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {trace!.issues.map((i: any) => (
                    <li key={i.id}>
                      <span className="font-mono text-xs text-slate-500">{i.rule.code}</span> <StatusBadge status={i.status} />
                      <p className="text-slate-600">{i.message}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title="Hand-offs">
              <EventList events={trace!.events} compact />
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

function Step({ n, title, dept, children, muted }: { n: number; title: string; dept: string; children: ReactNode; muted?: boolean }) {
  return (
    <div className={`flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${muted ? 'opacity-60' : ''}`}>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${muted ? 'bg-slate-100 text-slate-500' : 'bg-cyan-700 text-white'}`}>{n}</span>
      <div className="min-w-0 flex-1 space-y-0.5 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">
          {title} <span className="font-normal text-slate-500">· {dept}</span>
        </p>
        {children}
      </div>
    </div>
  );
}
