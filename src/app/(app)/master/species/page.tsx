'use client';

import { MasterPage } from '@/components/MasterPage';
import { peso } from '@/lib/format';

export default function SpeciesPage() {
  return (
    <MasterPage<any>
      title="Species"
      subtitle="Prices, freshness limit and shrinkage tolerance per species. These values drive DQ-06 (price range), DQ-10 (shrinkage) and DQ-13 (expiry)."
      path="species"
      writers={['OPERATIONS']}
      columns={[
        { header: 'Species', cell: (s) => <><p className="font-medium">{s.name}</p><p className="text-xs text-slate-500">{s.localName}</p></> },
        { header: 'Buying / kg', cell: (s) => peso(s.buyingPricePerKg) },
        { header: 'Selling range / kg', cell: (s) => `${peso(s.minSellPricePerKg)} – ${peso(s.maxSellPricePerKg)}` },
        { header: 'Shelf life', cell: (s) => `${s.maxShelfHours} h` },
        { header: 'Shrinkage tol.', cell: (s) => `${s.shrinkageTolerancePct}%` },
        { header: 'Storage temp', cell: (s) => `${s.minTempC}°C to ${s.maxTempC}°C` },
      ]}
      fields={[
        { key: 'name', label: 'Name', required: true },
        { key: 'localName', label: 'Local name' },
        { key: 'buyingPricePerKg', label: 'Buying price / kg (Grade A)', type: 'number', required: true },
        { key: 'maxShelfHours', label: 'Freshness limit (hours)', type: 'number', required: true },
        { key: 'minSellPricePerKg', label: 'Min selling price / kg', type: 'number', required: true },
        { key: 'maxSellPricePerKg', label: 'Max selling price / kg', type: 'number', required: true },
        { key: 'shrinkageTolerancePct', label: 'Shrinkage tolerance %', type: 'number', required: true },
        { key: 'minTempC', label: 'Min storage °C', type: 'number', required: true },
        { key: 'maxTempC', label: 'Max storage °C', type: 'number', required: true },
      ]}
    />
  );
}
