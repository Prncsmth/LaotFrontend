'use client';

import Link from 'next/link';
import { useApi } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { canAccess } from '@/lib/access';
import { Card, ErrorBox, LinkButton, Loading, Meter, PageHeader, Stat } from '@/components/ui';
import { EventList, type IntegrationEvent } from '@/components/EventList';
import { FlightBoard, type BoardRow } from '@/components/FlightBoard';
import { DEPT_LABEL, dateTime, kg, peso, timeAgo } from '@/lib/format';

type Dashboard = {
  arrivals: BoardRow[];
  departures: BoardRow[];
  kpis: { landedTodayKg: number; inStorageKg: number; openOrders: number; receivables: number; openIssues: number };
  stock: { species: string; availableKg: number; storedKg: number }[];
  expiringSoon: any[];
  events: IntegrationEvent[];
};
type Task = { department: string; title: string; count: number; href: string };

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, error } = useApi<Dashboard>('/dashboard');
  const { data: inbox } = useApi<Task[]>('/inbox');
  const { data: dq } = useApi<{ scores: { scope: string; score: number }[] }>('/dq/summary');
  const overall = dq?.scores.find((s) => s.scope === 'OVERALL');
  const maxStock = Math.max(1, ...(data?.stock.map((s) => s.storedKg) ?? [1]));

  return (
    <>
      <PageHeader title={`Good day, ${user?.name ?? ''}`} subtitle={`${user ? DEPT_LABEL[user.department] : ''} · company-wide view of today's operations`} />
      <ErrorBox error={error} />
      {!data ? (
        <Loading />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Stat icon="anchor" label="Landed today" value={kg(data.kpis.landedTodayKg)} />
            <Stat icon="snow" label="In cold storage" value={kg(data.kpis.inStorageKg)} />
            <Stat icon="tag" label="Open orders" value={data.kpis.openOrders} />
            <Stat icon="wallet" label="Receivables" value={peso(data.kpis.receivables)} />
            <Stat icon="alert" label="Open DQ issues" value={data.kpis.openIssues} tone={data.kpis.openIssues ? 'warn' : 'good'} sub={<LinkButton size="sm" href="/dq/issues">View queue</LinkButton>} />
            <Stat
              icon="gauge"
              label="Data quality score"
              value={overall ? `${overall.score}%` : '—'}
              tone={!overall ? 'default' : overall.score >= 95 ? 'good' : overall.score >= 85 ? 'warn' : 'bad'}
              sub={<LinkButton size="sm" href="/dq">DQ dashboard</LinkButton>}
            />
          </div>

          <div className="grid items-start gap-6 2xl:grid-cols-2">
            <FlightBoard type="arrivals" rows={data.arrivals} />
            <FlightBoard type="departures" rows={data.departures} />
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-3">
            <Card title="Your work queue" className="lg:col-span-1">
              {!inbox ? (
                <Loading />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {inbox.map((t, i) => (
                    <li key={i}>
                      <Link href={t.href} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-cyan-800">
                        <span>
                          {t.title}
                          {user?.department === 'ADMIN' && <span className="block text-xs text-slate-400">{DEPT_LABEL[t.department as keyof typeof DEPT_LABEL]}</span>}
                        </span>
                        <span className={`min-w-8 rounded-full px-2 py-0.5 text-center text-xs font-semibold tabular-nums ${t.count ? 'bg-cyan-700 text-white' : 'bg-slate-100 text-slate-500'}`}>{t.count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title="Stock in cold storage by species" className="lg:col-span-2">
              {data.stock.length === 0 ? (
                <p className="text-sm text-slate-500">No stock in storage.</p>
              ) : (
                <div className="space-y-3">
                  {data.stock
                    .sort((a, b) => b.storedKg - a.storedKg)
                    .map((s) => (
                      <Meter key={s.species} tone="neutral" value={s.storedKg} max={maxStock} label={s.species} right={`${kg(s.storedKg)} · ${kg(s.availableKg)} available`} />
                    ))}
                </div>
              )}
            </Card>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-2">
            <Card title="Expiring within 12 hours" actions={canAccess(user?.department, "/storage") && <LinkButton size="sm" href="/storage">Cold storage</LinkButton>}>
              {data.expiringSoon.length === 0 ? (
                <p className="text-sm text-slate-500">No lots close to expiry.</p>
              ) : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {data.expiringSoon.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-2 py-2">
                      <span>
                        <Link href={`/trace#${l.lotNo}`} className="font-medium text-cyan-800 hover:underline">
                          {l.lotNo}
                        </Link>{' '}
                        · {l.species.name} {l.grade} · {kg(l.netWeightKg - l.reservedKg)} free
                      </span>
                      <span className="text-xs text-red-700" title={dateTime(l.expiresAt)}>
                        expires {timeAgo(l.expiresAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title="Latest department hand-offs" actions={<LinkButton size="sm" href="/events">Integration log</LinkButton>}>
              <EventList events={data.events.slice(0, 8)} compact />
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
