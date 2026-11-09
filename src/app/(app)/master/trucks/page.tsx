'use client';

import { MasterPage } from '@/components/MasterPage';
import { Badge } from '@/components/ui';
import { kg } from '@/lib/format';

export default function TrucksPage() {
  return (
    <MasterPage<any>
      title="Trucks"
      subtitle="Delivery fleet. Only refrigerated (reefer) trucks can be assigned to seafood dispatches."
      path="trucks"
      writers={['SALES']}
      columns={[
        { header: 'Plate', cell: (t) => <span className="font-medium">{t.plateNo}</span> },
        { header: 'Capacity', cell: (t) => kg(t.capacityKg) },
        { header: 'Refrigerated', cell: (t) => (t.isReefer ? <Badge tone="cyan">✓ Reefer</Badge> : <Badge>No</Badge>) },
      ]}
      fields={[
        { key: 'plateNo', label: 'Plate no.', required: true },
        { key: 'capacityKg', label: 'Capacity (kg)', type: 'number', required: true },
        { key: 'isReefer', label: 'Refrigerated (reefer)', type: 'checkbox' },
      ]}
    />
  );
}
