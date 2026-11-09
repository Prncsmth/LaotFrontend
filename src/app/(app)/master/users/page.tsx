'use client';

import { MasterPage } from '@/components/MasterPage';
import { StatusBadge } from '@/components/ui';
import { DEPT_LABEL } from '@/lib/format';

export default function UsersPage() {
  return (
    <MasterPage<any>
      title="Users"
      subtitle="Each user belongs to one department, which decides what they can do. Admin manages users and data quality."
      path="users"
      writers={['ADMIN']}
      toForm={(u) => ({ ...u, password: '' })}
      columns={[
        { header: 'Name', cell: (u) => <span className="font-medium">{u.name}</span> },
        { header: 'Email', cell: (u) => u.email },
        { header: 'Department', cell: (u) => DEPT_LABEL[u.department as keyof typeof DEPT_LABEL] },
        { header: 'Status', cell: (u) => <StatusBadge status={u.active ? 'ACTIVE' : 'INACTIVE'} /> },
      ]}
      fields={[
        { key: 'name', label: 'Name', required: true },
        { key: 'email', label: 'Email', type: 'email', required: true },
        { key: 'department', label: 'Department', type: 'select', required: true, options: Object.entries(DEPT_LABEL).map(([value, label]) => ({ value, label })) },
        { key: 'password', label: 'Password', type: 'password', hint: 'At least 8 characters. Leave blank to keep the current one.' },
        { key: 'active', label: 'Active', type: 'checkbox' },
      ]}
    />
  );
}
