'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button, Field, Input } from '@/components/ui';
import { Logo, LogoMark } from '@/components/Logo';
import { Icon } from '@/components/icons';

const TITLE = 'LAOT';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      router.replace('/');
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white lg:flex-row">
      {/* ───────── Left: airport-style hero (ink & paper) ───────── */}
      <section className="relative overflow-hidden bg-[#111110] px-6 pt-8 pb-14 text-white sm:px-10 lg:flex lg:w-[56%] lg:flex-col lg:justify-between lg:py-10">
        {/* faint dot grid + soft warm glow */}
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(rgb(255 255 255 / 0.10) 1px, transparent 1px)', backgroundSize: '22px 22px' }} aria-hidden />
        <div className="pointer-events-none absolute -top-40 -right-32 h-112 w-md rounded-full bg-white opacity-[0.05] blur-3xl" aria-hidden />

        <div className="relative">
          <Logo tone="dark" size={42} />
        </div>

        <div className="relative mt-10 lg:mt-0">
          <p className="font-mono text-xs tracking-[0.35em] text-white/45">WELCOME TO</p>
          {/* split-flap title */}
          <div className="mt-3 flex flex-wrap gap-1.5" aria-label={TITLE}>
            {TITLE.split('').map((ch, i) =>
              ch === ' ' ? (
                <span key={i} className="w-3 sm:w-5" />
              ) : (
                <span
                  key={i}
                  className="flex h-16 w-12 animate-flap items-center justify-center rounded-lg bg-[#1f1f1d] font-mono text-[40px] font-bold text-[#f7f6f2] shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_6px_14px_rgb(0_0_0/0.45)] sm:h-24 sm:w-18 sm:text-[60px]"
                  style={{ animationDelay: `${i * 70}ms`, backgroundImage: 'linear-gradient(to bottom, transparent 49%, rgb(0 0 0 / 0.7) 50%, transparent 51%)' }}
                  aria-hidden
                >
                  {ch}
                </span>
              ),
            )}
          </div>
          {/* subtitle: what the name means */}
          <p className="mt-6 max-w-lg text-[22px] leading-snug font-medium tracking-[-0.01em] text-white sm:text-[26px]">The open sea, where every catch begins.</p>
        </div>

        <p className="relative mt-8 hidden font-mono text-[10px] tracking-[0.25em] text-white/30 lg:block">LAOT SEAFOOD TRADING CORPORATION · ENTERPRISE DATA MANAGEMENT</p>

        {/* drifting waves */}
        <svg className="pointer-events-none absolute right-0 bottom-0 left-0 h-14 w-[200%] animate-drift" viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden>
          <path d="M0 30 Q 75 10 150 30 T 300 30 T 450 30 T 600 30 T 750 30 T 900 30 T 1050 30 T 1200 30 V60 H0Z" fill="#ffffff" fillOpacity="0.04" />
          <path d="M0 40 Q 75 22 150 40 T 300 40 T 450 40 T 600 40 T 750 40 T 900 40 T 1050 40 T 1200 40 V60 H0Z" fill="#ffffff" fillOpacity="0.06" />
        </svg>
      </section>

      {/* ───────── Right: sign in ───────── */}
      <section className="flex flex-1 items-center justify-center bg-slate-50 px-5 py-10 sm:px-10">
        <div className="w-full max-w-105 animate-sheet">
          <div className="text-center">
            <LogoMark size={56} className="mx-auto mb-5 hidden drop-shadow-md lg:block" />
            <h1 className="text-[28px] font-bold tracking-[-0.02em] text-slate-900">Welcome</h1>
            <p className="mt-1 text-[15px] text-slate-500">Sign in to LAOT with your department account.</p>
          </div>

          <form onSubmit={signIn} className="mt-6 space-y-4">
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" placeholder="name@laot.com" required className="h-11 bg-white ring-1 ring-slate-200" />
            </Field>
            <Field label="Password">
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  className="h-11 bg-white pr-11 ring-1 ring-slate-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-1.5 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} className="h-4.5 w-4.5" />
                </button>
              </div>
            </Field>
            {error && (
              <p className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                <Icon name="alert" className="h-4 w-4 shrink-0" />
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy} className="h-11 w-full text-[15px]">
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">No account yet? Ask your Admin to create one.</p>
        </div>
      </section>
    </div>
  );
}
