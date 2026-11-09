'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAction, useApi } from '@/lib/hooks';
import { dateTime, kg, timeAgo } from '@/lib/format';
import { Badge, Button, Card, DataTable, ErrorBox, Field, Input, Loading, Meter, Modal, PageHeader, Select, StatusBadge } from '@/components/ui';

type Unit = {
  id: number; code: string; type: string; capacityKg: number; minTempC: number; maxTempC: number; loadKg: number;
  latest: { readingC: number; recordedAt: string } | null;
  temperatureLogs: { id: number; readingC: number; recordedAt: string }[];
};
type Lot = {
  id: number; lotNo: string; grade: string; status: string; netWeightKg: number; reservedKg: number; dispatchedKg: number; availableKg: number;
  expiresAt: string; storedAt: string | null;
  species: { name: string; minTempC: number; maxTempC: number };
  storageUnit: { code: string } | null;
  landingItem: { landing: { landingNo: string; vessel: { name: string } } };
};

export default function StoragePage() {
  const { can } = useAuth();
  const units = useApi<Unit[]>('/storage/overview');
  const lots = useApi<Lot[]>('/lots?status=GRADED,IN_STORAGE,RESERVED,QUARANTINED');
  const [logFor, setLogFor] = useState<Unit | null>(null);
  const [storeLot, setStoreLot] = useState<Lot | null>(null);
  const { run, busy } = useAction();
  const reload = () => {
    units.reload();
    lots.reload();
  };

  const waiting = lots.data?.filter((l) => l.status === 'GRADED');
  const stored = lots.data?.filter((l) => l.status === 'IN_STORAGE' || l.status === 'RESERVED');
  const quarantined = lots.data?.filter((l) => l.status === 'QUARANTINED');

  async function spoil(l: Lot) {
    if (!confirm(`Mark ${l.lotNo} as spoiled and dispose it?`)) return;
    if (await run(() => api(`/lots/${l.id}/spoil`, { body: { reason: 'Expired — disposed' } }), `${l.lotNo} marked as spoiled`)) reload();
  }

  return (
    <>
      <PageHeader
        title="Cold Storage"
        subtitle="Store graded lots, log freezer/chiller temperatures, and dispose expired lots. Expired lots are quarantined automatically by DQ-13."
      />
      <ErrorBox error={units.error ?? lots.error} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {!units.data ? (
          <Loading />
        ) : (
          units.data.map((u) => {
            const out = u.latest && (u.latest.readingC < u.minTempC || u.latest.readingC > u.maxTempC);
            const stale = !u.latest || Date.now() - new Date(u.latest.recordedAt).getTime() > 4 * 3600_000;
            return (
              <Card key={u.id} title={<span>{u.code} <span className="font-normal text-slate-500">· {u.type.replace('_', ' ').toLowerCase()}</span></span>}>
                <p className="text-xs text-slate-500">
                  Required {u.minTempC}°C to {u.maxTempC}°C
                </p>
                <p className={`mt-1 text-3xl font-semibold tabular-nums ${out ? 'text-red-600' : 'text-slate-900'}`}>{u.latest ? `${u.latest.readingC}°C` : '—'}</p>
                <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
                  {out && <Badge tone="red">✕ Out of range (DQ-12)</Badge>}
                  {stale && <Badge tone="amber">! No reading in 4 h (DQ-14)</Badge>}
                  {!out && !stale && <Badge tone="green">✓ OK</Badge>}
                  <span className="text-slate-500">{u.latest ? timeAgo(u.latest.recordedAt) : 'never logged'}</span>
                </div>
                <div className="mt-3">
                  <Meter tone="neutral" value={u.loadKg} max={u.capacityKg} label="Load" right={`${kg(u.loadKg)} / ${kg(u.capacityKg)}`} />
                </div>
                {can('OPERATIONS') && (
                  <Button size="sm" variant="secondary" className="mt-3 w-full" onClick={() => setLogFor(u)}>
                    Log temperature
                  </Button>
                )}
              </Card>
            );
          })
        )}
      </div>

      <div className="space-y-6">
        <Card title={`Waiting for storage (${waiting?.length ?? 0})`} padded={false}>
          <DataTable
            rows={waiting}
            rowKey={(l) => l.id}
            empty="No graded lots waiting."
            columns={[
              { header: 'Lot', cell: (l) => <LotLink lot={l} /> },
              { header: 'Species', cell: (l) => `${l.species.name} · Grade ${l.grade}` },
              { header: 'Net', cell: (l) => kg(l.netWeightKg) },
              { header: 'From', cell: (l) => `${l.landingItem.landing.vessel.name}` },
              { header: 'Expires', cell: (l) => <span title={dateTime(l.expiresAt)}>{timeAgo(l.expiresAt)}</span> },
              { header: '', className: 'text-right', cell: (l) => can('OPERATIONS') && <Button size="sm" onClick={() => setStoreLot(l)}>Store</Button> },
            ]}
          />
        </Card>

        <Card title={`Quarantined — expired (${quarantined?.length ?? 0})`} padded={false}>
          <DataTable
            rows={quarantined}
            rowKey={(l) => l.id}
            empty="No quarantined lots."
            columns={[
              { header: 'Lot', cell: (l) => <LotLink lot={l} /> },
              { header: 'Species', cell: (l) => `${l.species.name} · Grade ${l.grade}` },
              { header: 'Remaining', cell: (l) => kg(l.netWeightKg - l.dispatchedKg) },
              { header: 'Unit', cell: (l) => l.storageUnit?.code ?? '—' },
              { header: 'Expired', cell: (l) => <span className="text-red-700">{dateTime(l.expiresAt)}</span> },
              { header: '', className: 'text-right', cell: (l) => can('OPERATIONS') && <Button size="sm" variant="danger" disabled={busy} onClick={() => spoil(l)}>Mark spoiled</Button> },
            ]}
          />
        </Card>

        <Card title={`In storage (${stored?.length ?? 0})`} padded={false}>
          <DataTable
            rows={stored}
            rowKey={(l) => l.id}
            empty="Nothing in storage."
            columns={[
              { header: 'Lot', cell: (l) => <LotLink lot={l} /> },
              { header: 'Species', cell: (l) => `${l.species.name} · Grade ${l.grade}` },
              { header: 'Unit', cell: (l) => l.storageUnit?.code ?? <Badge tone="red">none</Badge> },
              { header: 'Net / Available', cell: (l) => `${kg(l.netWeightKg)} / ${kg(l.availableKg)}` },
              { header: 'Status', cell: (l) => <StatusBadge status={l.status} /> },
              { header: 'Expires', cell: (l) => <span title={dateTime(l.expiresAt)}>{timeAgo(l.expiresAt)}</span> },
            ]}
          />
        </Card>
      </div>

      {logFor && <TempModal unit={logFor} onClose={() => setLogFor(null)} onSaved={reload} />}
      {storeLot && units.data && <StoreModal lot={storeLot} units={units.data} onClose={() => setStoreLot(null)} onSaved={reload} />}
    </>
  );
}

const LotLink = ({ lot }: { lot: { lotNo: string } }) => (
  <Link href={`/trace#${lot.lotNo}`} className="font-medium text-cyan-800 hover:underline">
    {lot.lotNo}
  </Link>
);

function TempModal({ unit, onClose, onSaved }: { unit: Unit; onClose: () => void; onSaved: () => void }) {
  const [reading, setReading] = useState('');
  const { run, busy } = useAction();
  async function save() {
    if (await run(() => api('/temperature-logs', { body: { storageUnitId: unit.id, readingC: Number(reading) } }), `Temperature logged for ${unit.code}`)) {
      onSaved();
      onClose();
    }
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={`Log temperature · ${unit.code}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy || reading === ''}>
            Save reading
          </Button>
        </>
      }
    >
      <Field label="Reading (°C)" hint={`Required range for ${unit.code}: ${unit.minTempC}°C to ${unit.maxTempC}°C`}>
        <Input type="number" step="0.1" value={reading} onChange={(e) => setReading(e.target.value)} autoFocus />
      </Field>
      <div>
        <p className="mb-1 text-xs font-medium text-slate-600">Recent readings</p>
        <div className="flex flex-wrap gap-1.5">
          {unit.temperatureLogs.slice(0, 8).map((t) => (
            <span key={t.id} className={`rounded px-1.5 py-0.5 text-xs tabular-nums ${t.readingC < unit.minTempC || t.readingC > unit.maxTempC ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'}`} title={dateTime(t.recordedAt)}>
              {t.readingC}°C
            </span>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function StoreModal({ lot, units, onClose, onSaved }: { lot: Lot; units: Unit[]; onClose: () => void; onSaved: () => void }) {
  // suggest a unit whose temperature range fits the species
  const fits = (u: Unit) => u.minTempC >= lot.species.minTempC - 10 && u.maxTempC <= lot.species.maxTempC + 1;
  const [unitId, setUnitId] = useState(String(units.find(fits)?.id ?? ''));
  const { run, busy } = useAction();
  async function save() {
    if (await run(() => api(`/lots/${lot.id}/store`, { body: { storageUnitId: Number(unitId) } }), `${lot.lotNo} stored — Sales can now sell it`)) {
      onSaved();
      onClose();
    }
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={`Store ${lot.lotNo}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy}>
            Store lot
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">
        {lot.species.name} Grade {lot.grade}, {kg(lot.netWeightKg)}. Recommended temperature {lot.species.minTempC}°C to {lot.species.maxTempC}°C.
      </p>
      <Field label="Storage unit" hint="DQ-02 blocks storing without a unit; DQ-13 blocks storing an expired lot.">
        <Select value={unitId} onChange={(e) => setUnitId(e.target.value)}>
          <option value="">Select unit…</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.code} · {u.minTempC}…{u.maxTempC}°C · {kg(u.capacityKg - u.loadKg)} free {fits(u) ? '✓ suitable' : ''}
            </option>
          ))}
        </Select>
      </Field>
    </Modal>
  );
}
