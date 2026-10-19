export const ADMIN_TABS = ['dashboard', 'traffic', 'landing-editor', 'landing-journey', 'landing-news', 'landing-org', 'events', 'event-applications', 'event-suggestions', 'activities', 'booth-map', 'booths', 'venues', 'assets', 'library', 'reports', 'feedback', 'users', 'roles', 'audit', 'settings', 'notifications', 'profile'] as const;
export type AdminTab = typeof ADMIN_TABS[number];

export function isAdminTab(value: string | null | undefined): value is AdminTab {
  return ADMIN_TABS.some(tab => tab === value);
}

export function adminTabPath(tab: AdminTab): string {
  return tab === 'dashboard' ? '/admin' : `/admin/${tab}`;
}

export function resolveAdminTab(pathname: string, search: string): AdminTab {
  const path = pathname.replace(/\/+$/, '');
  const slug = path.startsWith('/admin/') ? path.slice('/admin/'.length) : '';
  if (isAdminTab(slug)) return slug;
  const legacyTab = new URLSearchParams(search).get('tab');
  return (path === '/admin' && isAdminTab(legacyTab)) ? legacyTab : 'dashboard';
}
