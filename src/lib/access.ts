import type { Department } from './api';
import type { IconName } from '@/components/icons';

// ─────────────────────────────────────────────────────────────
// Role-based access: which pages each department can open.
// The sidebar shows only these pages, and the Shell blocks the rest.
// ADMIN can open everything.
// The backend enforces the same rules on its API (see backend/src/routes).
//
//   OPERATIONS → landing, grading, cold storage
//   SALES      → sales orders, trucks, delivery (sales & logistics)
//   FINANCE    → fisher settlements, invoices, payments
// ─────────────────────────────────────────────────────────────

export type PageDef = { href: string; label: string; icon: IconName; section: string; roles: Department[] | 'ALL' };

export const PAGES: PageDef[] = [
  // Everyone
  { section: 'Overview', href: '/', label: 'Dashboard', icon: 'home', roles: 'ALL' },
  { section: 'Overview', href: '/trace', label: 'Lot Traceability', icon: 'qr', roles: 'ALL' },

  // Department work
  { section: 'My Work', href: '/landings', label: 'Landing & Grading', icon: 'anchor', roles: ['OPERATIONS'] },
  { section: 'My Work', href: '/storage', label: 'Cold Storage', icon: 'snow', roles: ['OPERATIONS'] },
  { section: 'My Work', href: '/sales', label: 'Sales Orders', icon: 'tag', roles: ['SALES'] },
  { section: 'My Work', href: '/dispatch', label: 'Dispatch & Delivery', icon: 'truck', roles: ['SALES'] },
  { section: 'My Work', href: '/finance', label: 'Finance', icon: 'wallet', roles: ['FINANCE'] },

  // Data quality — every department sees the scores and its own issues; tools are for the Admin
  { section: 'Data Quality', href: '/dq', label: 'DQ Dashboard', icon: 'gauge', roles: 'ALL' },
  { section: 'Data Quality', href: '/dq/issues', label: 'My DQ Issues', icon: 'alert', roles: 'ALL' },
  { section: 'Data Quality', href: '/dq/rules', label: 'Rules', icon: 'sliders', roles: [] },
  { section: 'Data Quality', href: '/dq/duplicates', label: 'Duplicates & Merge', icon: 'copy', roles: [] },
  { section: 'Data Quality', href: '/dq/cleansing', label: 'Standardization', icon: 'sparkles', roles: [] },

  // Integration
  { section: 'Integration', href: '/events', label: 'Integration Log', icon: 'flow', roles: 'ALL' },
  { section: 'Integration', href: '/audit', label: 'Audit Trail', icon: 'clock', roles: [] },

  // Master data — only what each department works with
  { section: 'Master Data', href: '/master/species', label: 'Species', icon: 'fish', roles: ['OPERATIONS', 'SALES'] },
  { section: 'Master Data', href: '/master/fishers', label: 'Fishers', icon: 'person', roles: ['OPERATIONS', 'FINANCE'] },
  { section: 'Master Data', href: '/master/vessels', label: 'Vessels', icon: 'boat', roles: ['OPERATIONS'] },
  { section: 'Master Data', href: '/master/storage-units', label: 'Storage Units', icon: 'box', roles: ['OPERATIONS'] },
  { section: 'Master Data', href: '/master/buyers', label: 'Buyers', icon: 'building', roles: ['SALES', 'FINANCE'] },
  { section: 'Master Data', href: '/master/trucks', label: 'Trucks', icon: 'truck', roles: ['SALES'] },
  { section: 'Master Data', href: '/master/users', label: 'Users', icon: 'badge', roles: [] },
];

const allowed = (page: PageDef, dept: Department) => dept === 'ADMIN' || page.roles === 'ALL' || page.roles.includes(dept);

/** The page definition that owns this path (longest matching prefix). */
export function pageFor(pathname: string) {
  return [...PAGES]
    .sort((a, b) => b.href.length - a.href.length)
    .find((p) => (p.href === '/' ? pathname === '/' : pathname === p.href || pathname.startsWith(p.href + '/')));
}

export function canAccess(dept: Department | undefined, pathname: string) {
  if (!dept) return false;
  const page = pageFor(pathname);
  return page ? allowed(page, dept) : true;
}

/** Sidebar sections with only the pages this department may open. */
export function navFor(dept: Department) {
  const sections: { section: string; items: PageDef[] }[] = [];
  for (const p of PAGES) {
    if (!allowed(p, dept)) continue;
    // admins see the department pages under a neutral heading
    const section = dept === 'ADMIN' && p.section === 'My Work' ? 'Departments' : p.section;
    const label = dept === 'ADMIN' && p.href === '/dq/issues' ? 'Issue Queue' : p.label;
    let group = sections.find((s) => s.section === section);
    if (!group) sections.push((group = { section, items: [] }));
    group.items.push({ ...p, label });
  }
  return sections;
}
