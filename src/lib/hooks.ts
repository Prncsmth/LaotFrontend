'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ApiError, type Violation } from './api';
import { useToast } from '@/components/toast';

/** Loads data from the API when the component mounts (and again on reload()). */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    try {
      setData(await api<T>(path));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, loading, reload, setData };
}

/**
 * Runs a POST/PUT action and shows the result as a toast:
 *  - green when saved
 *  - amber with the rule list when saved WITH data quality warnings
 *  - red with the rule list when BLOCKED by a data quality rule
 */
export function useAction() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function run<T>(fn: () => Promise<T>, successTitle: string): Promise<T | undefined> {
    setBusy(true);
    try {
      const result: any = await fn();
      const warnings: Violation[] = result?.warnings ?? result?.dqWarnings ?? [];
      if (warnings.length) {
        toast({ tone: 'warning', title: `${successTitle} — with data quality warnings`, lines: warnings.map((w) => `${w.code}: ${w.message}`) });
      } else {
        toast({ tone: 'success', title: successTitle });
      }
      return result;
    } catch (e) {
      if (e instanceof ApiError && e.violations?.length) {
        toast({ tone: 'error', title: 'Blocked by Data Quality Management', lines: e.violations.map((v) => `${v.code} ${v.name}: ${v.message}`) });
      } else if (e instanceof ApiError && e.fields?.length) {
        toast({ tone: 'error', title: e.message, lines: e.fields.map((f) => `${f.field || 'form'}: ${f.message}`) });
      } else {
        toast({ tone: 'error', title: (e as Error).message });
      }
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  return { run, busy };
}
