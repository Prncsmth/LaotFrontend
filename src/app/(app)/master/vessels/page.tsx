'use client';

import { MasterPage } from '@/components/MasterPage';
import { kg } from '@/lib/format';

export default function VesselsPage() {
  return (
    <MasterPage<any>
      title="Vessels"
      subtitle="Registered fishing boats. Capacity is used by DQ-07 to flag landings heavier than the boat can carry."
      path="vessels"
      writers={['OPERATIONS']}
      columns={[
        { header: 'Vessel', cell: (v) => <><p className="font-medium">{v.name}</p><p className="text-xs text-slate-500">{v.registrationNo}</p></> },
        { header: 'Owner', cell: (v) => v.owner.name },
        { header: 'Capacity', cell: (v) => kg(v.capacityKg) },
      ]}
      fields={[
        { key: 'registrationNo', label: 'Registration no.', required: true },
        { key: 'name', label: 'Vessel name', required: true },
        { key: 'ownerId', label: 'Owner (fisher)', type: 'select', required: true, optionsFrom: { path: 'fishers?status=ACTIVE', label: (f) => f.name } },
        { key: 'capacityKg', label: 'Capacity (kg)', type: 'number', required: true },
      ]}
    />
  );
}
