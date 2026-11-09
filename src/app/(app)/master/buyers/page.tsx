'use client';

import { MasterPage } from '@/components/MasterPage';
import { StatusBadge } from '@/components/ui';
import { peso } from '@/lib/format';

export default function BuyersPage() {
  return (
    <MasterPage<any>
      title="Buyers"
      subtitle="Customers of the trading company. Shared by Sales (orders) and Finance (invoices)."
      path="buyers"
      writers={['SALES']}
      columns={[
        { header: 'Business', cell: (b) => <><p className="font-medium">{b.businessName}</p><p className="text-xs text-slate-500">#{b.id}{b.mergedIntoId ? ` → merged into #${b.mergedIntoId}` : ''}</p></> },
        { header: 'Contact', cell: (b) => <>{b.contactPerson ?? '—'}<p className="text-xs text-slate-500">{b.phone}</p></> },
        { header: 'Email', cell: (b) => b.email ?? '—' },
        { header: 'TIN', cell: (b) => b.tin ?? <span className="italic text-slate-400">none</span> },
        { header: 'Credit limit', cell: (b) => peso(b.creditLimit) },
        { header: 'Status', cell: (b) => <StatusBadge status={b.status} /> },
      ]}
      fields={[
        { key: 'businessName', label: 'Business name', required: true },
        { key: 'contactPerson', label: 'Contact person' },
        { key: 'phone', label: 'Mobile' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'tin', label: 'TIN' },
        { key: 'creditLimit', label: 'Credit limit (₱)', type: 'number' },
        { key: 'address', label: 'Address' },
        { key: 'status', label: 'Status', type: 'select', options: [{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }] },
      ]}
    />
  );
}
