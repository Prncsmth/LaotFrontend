'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { DEPT_LABEL } from '@/lib/format';
import { canAccess, navFor, pageFor } from '@/lib/access';
import { Icon } from './icons';
import { Logo, LogoMark } from './Logo';

export function AppMark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return <LogoMark size={size === 'lg' ? 56 : 32} className="shrink-0 drop-shadow-sm" />;
}

/** Live local time, e.g. "6:33 PM". Renders a placeholder on the server. */
export function LocalTime({ className = '' }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(t);
  }, []);
  return <span className={`tabular-nums ${className}`}>{now ? now.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }) : '--:--'}</span>;
}

const initials = (name: string) =>
  name
    .split(/\s|\//)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

export function Shell({ children }: { children: ReactNode }) {
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace('/login');
  }, [ready, user, router]);

  useEffect(() => setMenuOpen(false), [pathname]);

  const signedIn = ready && !!user;
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname === href || (href !== '/dq' && pathname.startsWith(href + '/')));

  const sidebar = user && (
    <nav className="flex h-full flex-col">
      <div className="px-4 pt-5 pb-4">
        <Link href="/" aria-label="LAOT home">
          <Logo size={32} />
        </Link>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-2.5 pb-4">
        {navFor(user.department).map((group) => (
          <div key={group.section}>
            <p className="px-2.5 pb-1 text-[11px] font-semibold text-slate-400">{group.section}</p>
            <div className="space-y-px">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-1.75 text-[13.5px] transition-colors ${active ? 'bg-slate-900 font-medium text-white shadow-sm' : 'text-slate-700 hover:bg-black/5'}`}
                  >
                    <Icon name={item.icon} className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-white' : 'text-slate-500'}`} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-black/6 p-3">
        <div className="flex items-center gap-2.5 rounded-xl p-1.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[13px] font-semibold text-slate-700">{initials(user.name)}</span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[13px] font-medium text-slate-900">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{DEPT_LABEL[user.department]}</p>
          </div>
          <button onClick={logout} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-black/6 hover:text-slate-900" aria-label="Log out" title="Log out">
            <Icon name="logout" className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </nav>
  );

  // The page (children) always renders at the same place in the tree, so Next.js can
  // prerender it. Until we know who is logged in it stays hidden behind a loading screen.
  return (
    <div className="min-h-screen bg-slate-50">
      {signedIn ? (
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-black/6 bg-white/70 backdrop-blur-2xl backdrop-saturate-150 lg:block">{sidebar}</aside>
      ) : (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-slate-50">
          <AppMark size="lg" />
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" aria-label="Loading" />
        </div>
      )}
      {signedIn && menuOpen && (
        <div className="fixed inset-0 z-40 animate-fade lg:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" />
          <aside className="absolute inset-y-0 left-0 w-72 animate-sheet bg-white/90 shadow-pop backdrop-blur-2xl" onClick={(e) => e.stopPropagation()}>
            {sidebar}
          </aside>
        </div>
      )}
      <div className={signedIn ? 'lg:pl-64' : 'invisible lg:pl-64'} aria-hidden={!signedIn}>
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-black/6 bg-white/75 px-4 py-2.5 backdrop-blur-xl backdrop-saturate-150 lg:hidden">
          <button onClick={() => setMenuOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-900 hover:bg-black/5" aria-label="Open menu">
            <Icon name="menu" />
          </button>
          <Logo size={28} />
        </header>
        <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-10 lg:py-9">{signedIn && !canAccess(user?.department, pathname) ? <NoAccess page={pageFor(pathname)?.label} /> : children}</main>
      </div>
    </div>
  );
}

/** Shown when someone opens a page that belongs to another department. */
function NoAccess({ page }: { page?: string }) {
  const { user } = useAuth();
  return (
    <div className="mx-auto mt-16 max-w-md animate-sheet rounded-2xl bg-white p-8 text-center shadow-card ring-1 ring-black/4">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-700">
        <Icon name="alert" className="h-7 w-7" />
      </span>
      <h1 className="mt-4 text-xl font-semibold text-slate-900">No access</h1>
      <p className="mt-2 text-[15px] text-slate-500">
        {page ? <><strong className="text-slate-700">{page}</strong> belongs to another department.</> : 'This page belongs to another department.'} You are signed in as{' '}
        <strong className="text-slate-700">{user ? DEPT_LABEL[user.department] : ''}</strong>.
      </p>
      <Link href="/" className="mt-6 inline-flex h-9 items-center rounded-full bg-slate-900 px-4 text-sm font-medium text-white hover:bg-black">
        Go to my dashboard
      </Link>
    </div>
  );
}
