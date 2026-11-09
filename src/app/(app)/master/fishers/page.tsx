'use client';

import { MasterPage } from '@/components/MasterPage';
import { StatusBadge } from '@/components/ui';

const missing = <span className="italic text-red-600">missing</span>;

export default function FishersPage() {
  return (
    <MasterPage<any>
      title="Fishers"
      subtitle="Boat owners we buy from. Names, phones and TINs are standardized automatically; DQ-03 blocks invalid formats and DQ-08 warns about possible duplicates."
      path="fishers"
      writers={['OPERATIONS']}
      columns={[
        { header: 'Name', cell: (f) => <><p className="font-medium">{f.name}</p><p className="text-xs text-slate-500">#{f.id}{f.mergedIntoId ? ` → merged into #${f.mergedIntoId}` : ''}</p></> },
        { header: 'Phone', cell: (f) => f.phone ?? '—' },
        { header: 'TIN', cell: (f) => f.tin ?? missing },
        { header: 'Payout', cell: (f) => (f.payoutMethod ? `${f.payoutMethod} ${f.payoutAccount ?? ''}` : missing) },
        { header: 'Vessels', cell: (f) => f.vessels.map((v: any) => v.name).join(', ') || '—' },
        { header: 'Status', cell: (f) => <StatusBadge status={f.status} /> },
      ]}
      fields={[
        { key: 'name', label: 'Full name', required: true },
        { key: 'phone', label: 'Mobile', hint: 'Any format, e.g. +63 917 123 4567 → saved as 09171234567' },
        { key: 'tin', label: 'TIN', hint: '12 digits → saved as XXX-XXX-XXX-XXX' },
        { key: 'address', label: 'Address' },
        { key: 'payoutMethod', label: 'Payout method', type: 'select', options: [{ value: 'GCASH', label: 'GCash' }, { value: 'BANK', label: 'Bank' }, { value: 'CASH', label: 'Cash' }] },
        { key: 'payoutAccount', label: 'Payout account no.' },
        { key: 'status', label: 'Status', type: 'select', options: [{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }] },
      ]}
    />
  );
}
