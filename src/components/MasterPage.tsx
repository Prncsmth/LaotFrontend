'use client';

import { useState, type ReactNode } from 'react';
import { api, type Department } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAction, useApi } from '@/lib/hooks';
import { Button, Card, DataTable, ErrorBox, Field, Input, Modal, PageHeader, Select, Switch, type Column } from '@/components/ui';
import { Icon } from '@/components/icons';
import { DEPT_LABEL } from '@/lib/format';

export type FieldDef = {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'select' | 'checkbox' | 'password' | 'email';
  options?: { value: string; label: string }[];
  optionsFrom?: { path: string; label: (row: any) => string };
  hint?: string;
  required?: boolean;
  step?: string;
};

/**
 * Generic master-data screen (list + add/edit form). Fishers and buyers are
 * cleaned and checked by the DQ rules on the server; warnings come back as toasts.
 */
export function MasterPage<T extends { id: number }>({
  title, subtitle, path, columns, fields, writers, toForm, empty,
}: {
  title: string;
  subtitle?: ReactNode;
  path: string;
  columns: Column<T>[];
  fields: FieldDef[];
  writers: Department[];
  toForm?: (row: T) => Record<string, any>;
  empty?: string;
}) {
  const { can } = useAuth();
  const [q, setQ] = useState('');
  const { data, error, reload } = useApi<T[]>(`/${path}${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  const [editing, setEditing] = useState<{ id: number | null; values: Record<string, any> } | null>(null);
  const canWrite = can(...writers);

  const blank = Object.fromEntries(fields.map((f) => [f.key, f.type === 'checkbox' ? true : '']));
  const open = (row?: T) =>
    setEditing({
      id: row?.id ?? null,
      values: row ? { ...blank, ...Object.fromEntries(fields.map((f) => [f.key, (toForm ? toForm(row) : (row as any))[f.key] ?? (f.type === 'checkbox' ? false : '')])) } : blank,
    });

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} actions={canWrite && <Button icon="plus" onClick={() => open()}>Add</Button>} />
      <ErrorBox error={error} />
      {!canWrite && (
        <div className="mb-5 flex items-start gap-2.5 rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 shadow-card ring-1 ring-black/4">
          <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          <span>
            <strong className="text-slate-900">View only.</strong> {title} are added and edited by{' '}
            <strong className="text-slate-900">{[...writers.map((w) => DEPT_LABEL[w]), 'Admin'].join(' or ')}</strong>. Ask them if something needs to change.
          </span>
        </div>
      )}
      <Card
        padded={false}
        title={data ? `${data.length} record${data.length === 1 ? '' : 's'}` : 'Records'}
        actions={
          <div className="relative">
            <Icon name="search" className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} className="w-56 pl-8" aria-label="Search" />
          </div>
        }
      >
        <DataTable
          rows={data}
          rowKey={(r) => r.id}
          empty={empty}
          columns={[...columns, ...(canWrite ? [{ header: '', className: 'text-right', cell: (r: T) => <Button size="sm" variant="ghost" onClick={() => open(r)}>Edit</Button> }] : [])]}
        />
      </Card>
      {editing && <EditModal title={title} path={path} fields={fields} editing={editing} onClose={() => setEditing(null)} onSaved={reload} />}
    </>
  );
}

function EditModal({ title, path, fields, editing, onClose, onSaved }: { title: string; path: string; fields: FieldDef[]; editing: { id: number | null; values: Record<string, any> }; onClose: () => void; onSaved: () => void }) {
  const [values, setValues] = useState(editing.values);
  const { run, busy } = useAction();
  const set = (k: string, v: any) => setValues({ ...values, [k]: v });

  async function save() {
    const r = await run(() => api(editing.id ? `/${path}/${editing.id}` : `/${path}`, { method: editing.id ? 'PUT' : 'POST', body: values }), editing.id ? 'Saved' : 'Added');
    if (r) {
      onSaved();
      onClose();
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`${editing.id ? 'Edit' : 'Add'} · ${title}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy}>
            Save
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <FieldInput key={f.key} def={f} value={values[f.key]} onChange={(v) => set(f.key, v)} />
        ))}
      </div>
    </Modal>
  );
}

function FieldInput({ def, value, onChange }: { def: FieldDef; value: any; onChange: (v: any) => void }) {
  const { data: remote } = useApi<any[]>(def.optionsFrom ? `/${def.optionsFrom.path}` : null);
  const options = def.options ?? remote?.map((r) => ({ value: String(r.id), label: def.optionsFrom!.label(r) }));

  if (def.type === 'checkbox') {
    return (
      <div className="flex items-end pb-1.5">
        <Switch checked={!!value} onChange={onChange} label={def.label} />
      </div>
    );
  }
  return (
    <Field label={def.label + (def.required ? ' *' : '')} hint={def.hint}>
      {def.type === 'select' ? (
        <Select value={value == null ? '' : String(value)} onChange={(e) => onChange(e.target.value)}>
          <option value="">{def.required ? 'Select…' : '— none —'}</option>
          {options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      ) : (
        <Input type={def.type ?? 'text'} step={def.step ?? (def.type === 'number' ? 'any' : undefined)} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      )}
    </Field>
  );
}
