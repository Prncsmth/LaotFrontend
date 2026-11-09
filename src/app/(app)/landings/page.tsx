'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FlightBoard } from '@/components/FlightBoard';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAction, useApi } from '@/lib/hooks';
import { dateTime, kg, timeAgo, toLocalInput } from '@/lib/format';
import { Badge, Button, Card, ErrorBox, Field, Input, Loading, Modal, PageHeader, Segmented, Select, StatusBadge } from '@/components/ui';

type Species = { id: number; name: string; localName: string | null };
type Lot = { id: number; lotNo: string; grade: string; netWeightKg: number; status: string };
type Item = { id: number; species: Species; grossWeightKg: number; gradedAt: string | null; lots: Lot[] };
type Landing = {
  id: number; landingNo: string; arrivedAt: string; status: string; notes: string | null;
  vessel: { name: string; capacityKg: number; owner: { name: string } };
  receivedBy: { name: string } | null;
  items: Item[];
  settlement: { settlementNo: string; status: string } | null;
};

export default function LandingsPage() {
  const { can } = useAuth();
  const { data, error, reload } = useApi<Landing[]>('/landings');
  // bump the board too, so it shows the change right away
  const [version, setVersion] = useState(0);
  const refresh = () => {
    reload();
    setVersion((v) => v + 1);
  };
  const [showNew, setShowNew] = useState(false);
  const [grading, setGrading] = useState<{ landing: Landing; item: Item } | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'RECEIVED' | 'GRADED'>('ALL');

  const rows = data?.filter((l) => filter === 'ALL' || l.status === filter);

  return (
    <>
      <PageHeader
        title="Landing & Grading"
        subtitle="Port Operations records each boat's catch (gross weight). Quality Control grades it into lots (net weight + grade), which are handed to Cold Storage automatically."
        actions={can('OPERATIONS') && <Button icon="plus" onClick={() => setShowNew(true)}>Record landing</Button>}
      />
      <ErrorBox error={error} />
      <div className="mb-6">
        <FlightBoard type="arrivals" take={10} version={version} />
      </div>
      <div className="mb-4">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'ALL', label: 'All' },
            { value: 'RECEIVED', label: 'Waiting for QC' },
            { value: 'GRADED', label: 'Graded' },
          ]}
        />
      </div>
      {!rows ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">No landings.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((l) => {
            const total = l.items.reduce((s, i) => s + i.grossWeightKg, 0);
            return (
              <Card
                key={l.id}
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    {l.landingNo} <StatusBadge status={l.status} />
                    {total > l.vessel.capacityKg && <Badge tone="amber">DQ-07 over capacity</Badge>}
                  </span>
                }
                actions={
                  l.settlement && (
                    <span className="text-xs text-slate-500">
                      Settlement {l.settlement.settlementNo} <StatusBadge status={l.settlement.status} />
                    </span>
                  )
                }
              >
                <p className="mb-3 text-sm text-slate-600">
                  <span className="font-medium text-slate-800">{l.vessel.name}</span> · owner {l.vessel.owner.name} · arrived {dateTime(l.arrivedAt)} ({timeAgo(l.arrivedAt)}) · {kg(total)} of {kg(l.vessel.capacityKg)} capacity
                  {l.receivedBy && ` · received by ${l.receivedBy.name}`}
                  {l.notes && <span className="block text-slate-500">“{l.notes}”</span>}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="py-1.5 pr-4">Species</th>
                        <th className="py-1.5 pr-4">Gross</th>
                        <th className="py-1.5 pr-4">Lots (grade · net)</th>
                        <th className="py-1.5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {l.items.map((it) => {
                        const net = it.lots.reduce((s, x) => s + x.netWeightKg, 0);
                        return (
                          <tr key={it.id}>
                            <td className="py-2 pr-4">
                              {it.species.name} <span className="text-slate-400">{it.species.localName}</span>
                            </td>
                            <td className="py-2 pr-4 tabular-nums">{kg(it.grossWeightKg)}</td>
                            <td className="py-2 pr-4">
                              {it.lots.length === 0 ? (
                                <span className="text-slate-400">not graded</span>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {it.lots.map((lot) => (
                                    <Link key={lot.id} href={`/trace#${lot.lotNo}`} className="rounded border border-slate-200 px-1.5 py-0.5 text-xs hover:border-cyan-600">
                                      <span className="font-medium text-cyan-800">{lot.lotNo}</span> · {lot.grade} · {kg(lot.netWeightKg)}
                                    </Link>
                                  ))}
                                  <span className="text-xs text-slate-500">yield {Math.round((net / it.grossWeightKg) * 100)}%</span>
                                </div>
                              )}
                            </td>
                            <td className="py-2 text-right">
                              {!it.gradedAt && can('OPERATIONS') && (
                                <Button size="sm" onClick={() => setGrading({ landing: l, item: it })}>
                                  Grade
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {showNew && <NewLandingModal onClose={() => setShowNew(false)} onSaved={refresh} />}
      {grading && <GradeModal landing={grading.landing} item={grading.item} onClose={() => setGrading(null)} onSaved={refresh} />}
    </>
  );
}

function NewLandingModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { data: vessels } = useApi<{ id: number; name: string; capacityKg: number; owner: { name: string; status: string } }[]>('/vessels');
  const { data: species } = useApi<Species[]>('/species');
  const [vesselId, setVesselId] = useState('');
  const [arrivedAt, setArrivedAt] = useState(() => toLocalInput(new Date()));
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ speciesId: '', grossWeightKg: '' }]);
  const { run, busy } = useAction();

  const vessel = vessels?.find((v) => v.id === Number(vesselId));
  const total = items.reduce((s, i) => s + (Number(i.grossWeightKg) || 0), 0);

  async function save() {
    const r = await run(
      () =>
        api('/landings', {
          body: { vesselId: Number(vesselId), arrivedAt: new Date(arrivedAt).toISOString(), notes, items: items.map((i) => ({ speciesId: Number(i.speciesId), grossWeightKg: Number(i.grossWeightKg) })) },
        }),
      'Landing recorded — QC has been notified',
    );
    if (r) {
      onSaved();
      onClose();
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Record a landing"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy || !vesselId}>
            Save landing
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Vessel">
          <Select value={vesselId} onChange={(e) => setVesselId(e.target.value)}>
            <option value="">Select vessel…</option>
            {vessels?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} — {v.owner.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Arrived at">
          <Input type="datetime-local" value={arrivedAt} onChange={(e) => setArrivedAt(e.target.value)} />
        </Field>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-600">Catch (gross weight at the pier)</p>
        {items.map((it, idx) => (
          <div key={idx} className="flex gap-2">
            <Select value={it.speciesId} onChange={(e) => setItems(items.map((x, i) => (i === idx ? { ...x, speciesId: e.target.value } : x)))}>
              <option value="">Species…</option>
              {species?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.localName})
                </option>
              ))}
            </Select>
            <Input type="number" min="0" step="0.01" placeholder="kg" className="max-w-32" value={it.grossWeightKg} onChange={(e) => setItems(items.map((x, i) => (i === idx ? { ...x, grossWeightKg: e.target.value } : x)))} />
            <Button variant="ghost" size="sm" onClick={() => setItems(items.filter((_, i) => i !== idx))} disabled={items.length === 1} aria-label="Remove row">
              ✕
            </Button>
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={() => setItems([...items, { speciesId: '', grossWeightKg: '' }])}>
          + Add species
        </Button>
        {vessel && (
          <p className={`text-xs ${total > vessel.capacityKg ? 'font-medium text-amber-700' : 'text-slate-500'}`}>
            Total {kg(total)} / vessel capacity {kg(vessel.capacityKg)}
            {total > vessel.capacityKg && ' — DQ-07 will flag this as a warning'}
          </p>
        )}
      </div>
      <Field label="Notes (optional)">
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
    </Modal>
  );
}

function GradeModal({ landing, item, onClose, onSaved }: { landing: Landing; item: Item; onClose: () => void; onSaved: () => void }) {
  const [lots, setLots] = useState([{ grade: 'A', netWeightKg: '' }]);
  const { run, busy } = useAction();
  const net = lots.reduce((s, l) => s + (Number(l.netWeightKg) || 0), 0);

  async function save() {
    const r = await run(
      () => api(`/landing-items/${item.id}/grade`, { body: { lots: lots.map((l) => ({ grade: l.grade, netWeightKg: Number(l.netWeightKg) })) } }),
      'Lots created — Cold Storage has been notified',
    );
    if (r) {
      onSaved();
      onClose();
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Grade ${item.species.name} · ${landing.landingNo}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy}>
            Create lots
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">
        Gross weight received: <strong>{kg(item.grossWeightKg)}</strong>. Split the catch into lots by grade (A best, C lowest) and enter each lot&apos;s net weight after cleaning.
      </p>
      {lots.map((l, idx) => (
        <div key={idx} className="flex gap-2">
          <Select className="max-w-36" value={l.grade} onChange={(e) => setLots(lots.map((x, i) => (i === idx ? { ...x, grade: e.target.value } : x)))}>
            <option value="A">Grade A</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
          </Select>
          <Input type="number" min="0" step="0.01" placeholder="Net kg" value={l.netWeightKg} onChange={(e) => setLots(lots.map((x, i) => (i === idx ? { ...x, netWeightKg: e.target.value } : x)))} />
          <Button variant="ghost" size="sm" onClick={() => setLots(lots.filter((_, i) => i !== idx))} disabled={lots.length === 1} aria-label="Remove lot">
            ✕
          </Button>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={() => setLots([...lots, { grade: 'B', netWeightKg: '' }])}>
        + Add lot
      </Button>
      <p className={`text-sm ${net > item.grossWeightKg ? 'font-medium text-red-700' : 'text-slate-600'}`}>
        Net total {kg(net)} of {kg(item.grossWeightKg)} gross
        {net > item.grossWeightKg && ' — DQ-05 will BLOCK this (net cannot exceed gross)'}
      </p>
    </Modal>
  );
}
