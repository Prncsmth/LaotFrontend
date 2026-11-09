'use client';

import { MasterPage } from '@/components/MasterPage';
import { kg, label } from '@/lib/format';

export default function StorageUnitsPage() {
  return (
    <MasterPage<any>
      title="Storage Units"
      subtitle="Blast freezers and chillers. The temperature range is checked by DQ-12 on every reading."
      path="storage-units"
      writers={['OPERATIONS']}
      columns={[
        { header: 'Code', cell: (u) => <span className="font-medium">{u.code}</span> },
        { header: 'Type', cell: (u) => label(u.type) },
        { header: 'Capacity', cell: (u) => kg(u.capacityKg) },
        { header: 'Required temp', cell: (u) => `${u.minTempC}°C to ${u.maxTempC}°C` },
      ]}
      fields={[
        { key: 'code', label: 'Code', required: true },
        { key: 'type', label: 'Type', type: 'select', required: true, options: [{ value: 'BLAST_FREEZER', label: 'Blast freezer' }, { value: 'CHILLER', label: 'Chiller' }] },
        { key: 'capacityKg', label: 'Capacity (kg)', type: 'number', required: true },
        { key: 'minTempC', label: 'Min °C', type: 'number', required: true },
        { key: 'maxTempC', label: 'Max °C', type: 'number', required: true },
      ]}
    />
  );
}
