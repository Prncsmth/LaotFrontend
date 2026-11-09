'use client';

import { useState } from 'react';
import { useApi } from '@/lib/hooks';
import { DEPT_LABEL } from '@/lib/format';
import { Card, ErrorBox, Field, Loading, PageHeader, Select } from '@/components/ui';
import { EventList, type IntegrationEvent } from '@/components/EventList';

const FLOW = [
  ['Operations', 'LotStored', 'Sales & Logistics (stock available)'],
  ['Operations', 'LandingGraded', 'Finance (fisher settlement drafted)'],
  ['Sales & Logistics', 'DispatchDelivered', 'Finance (invoice issued)'],
  ['Sales & Logistics', 'ShrinkageAlert', 'Operations (weight loss check)'],
  ['Finance', 'PaymentReceived', 'Sales & Logistics'],
  ['Finance', 'SettlementPaid', 'Operations'],
];

export default function EventsPage() {
  const [department, setDepartment] = useState('');
  const { data, error } = useApi<IntegrationEvent[]>(`/events${department ? `?department=${department}` : ''}`);

  return (
    <>
      <PageHeader
        title="Integration Log"
        subtitle="Every hand-off between departments is published as an event. Other departments react automatically — nobody re-encodes the same data."
      />
      <ErrorBox error={error} />
      <Card title="How data flows through the company" className="mb-6">
        <ol className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {FLOW.map(([from, ev, to], i) => (
            <li key={i} className="rounded-lg border border-slate-200 px-3 py-2">
              <span className="font-medium">{from}</span> <span className="text-slate-400">→</span> <span className="font-medium">{to}</span>
              <p className="font-mono text-xs text-slate-500">{ev}</p>
            </li>
          ))}
        </ol>
      </Card>
      <Card
        title={data ? `${data.length} events` : 'Events'}
        actions={
          <Field label="" className="w-56">
            <Select value={department} onChange={(e) => setDepartment(e.target.value)} aria-label="Filter by department">
              <option value="">All departments</option>
              {Object.entries(DEPT_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
        }
      >
        {!data ? <Loading /> : <EventList events={data} />}
      </Card>
    </>
  );
}
