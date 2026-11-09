'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Icon, type IconName } from './icons';

// iOS-style notification banners (top-right, frosted glass).
type Tone = 'success' | 'warning' | 'error' | 'info';
type Toast = { id: number; tone: Tone; title: string; lines?: string[] };

const ToastContext = createContext<(t: Omit<Toast, 'id'>) => void>(() => {});
export const useToast = () => useContext(ToastContext);

const STYLE: Record<Tone, { icon: IconName; bubble: string }> = {
  success: { icon: 'check', bubble: 'bg-slate-900' },
  warning: { icon: 'alert', bubble: 'bg-amber-600' },
  error: { icon: 'x', bubble: 'bg-accent' },
  info: { icon: 'info', bubble: 'bg-slate-600' },
};

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = nextId++;
    setToasts((all) => [...all.slice(-3), { ...t, id }]);
    setTimeout(() => dismiss(id), t.tone === 'success' ? 4000 : 12000);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-60 flex w-[min(26rem,calc(100vw-2rem))] flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto animate-banner rounded-2xl bg-white/90 p-3.5 shadow-pop ring-1 ring-black/6 backdrop-blur-2xl backdrop-saturate-150">
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${STYLE[t.tone].bubble}`}>
                <Icon name={STYLE[t.tone].icon} className="h-4 w-4" strokeWidth={2.4} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug text-slate-900">{t.title}</p>
                {t.lines?.map((l, i) => (
                  <p key={i} className="mt-1 text-[13px] leading-snug text-slate-600">
                    {l}
                  </p>
                ))}
              </div>
              <button onClick={() => dismiss(t.id)} className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-black/5 hover:text-slate-700" aria-label="Dismiss">
                <Icon name="x" className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
