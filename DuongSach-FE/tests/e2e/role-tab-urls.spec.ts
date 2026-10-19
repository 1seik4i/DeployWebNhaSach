import { expect, test } from '@playwright/test';
import { ADMIN_TABS, adminTabPath, resolveAdminTab } from '../../src/utils/adminNavigation';

// Isolate URL/history behavior from backend data and authentication.
for (const role of ['admin', 'partner'] as const) {
  test(`${role}: URL survives reload and browser history`, async ({ page }) => {
    await page.addInitScript(role => {
      sessionStorage.setItem('duongsach_token', 'routing-test');
      sessionStorage.setItem('duongsach_user', JSON.stringify({ primaryRole: role }));
    }, role);
    await page.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname;
      let data: unknown = [];
      if (path.endsWith('/profile')) data = { id: 'routing-user', name: 'Routing Partner', fullName: 'Routing Admin', email: 'routing@example.test' };
      if (path.endsWith('/admin/settings')) data = [{ key: 'admin.system', value: {} }];
      if (path.endsWith('/admin/dashboard')) data = { userCount: 0, eventCount: 0, openEventCount: 0, boothCount: 0, activityCount: 0, todayActivityCount: 0, usersByRole: {}, auditByDay: [] };
      await route.fulfill({ json: { success: true, data } });
    });
    await page.goto(`/${role}/notifications`);
    const sidebar = page.locator('.role-sidebar');
    await expect(sidebar.locator('[aria-current="page"]')).toHaveCount(1);
    await page.reload();
    await expect(page).toHaveURL(new RegExp(`/${role}/notifications$`));
    await expect(sidebar.locator('[aria-current="page"]')).toHaveCount(1);
    if (test.info().project.name === 'mobile-chromium') {
      await page.locator(role === 'admin' ? '.admin-mobile-menu-btn' : '.partner-mobile-toggle').click();
    }
    await sidebar.locator('nav button').filter({ hasText: /H\u1ed3 s\u01a1/ }).click();
    await expect(page).toHaveURL(new RegExp(`/${role}/profile$`));
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/${role}/notifications$`));
    await expect(sidebar.locator('[aria-current="page"]')).toHaveCount(1);
    await page.goForward();
    await expect(page).toHaveURL(new RegExp(`/${role}/profile$`));
    await page.reload();
    await expect(page).toHaveURL(new RegExp(`/${role}/profile$`));
    await expect(sidebar.locator('[aria-current="page"]')).toHaveCount(1);
    if (role === 'admin') {
      await page.goto('/admin?tab=notifications');
      await expect(page).toHaveURL(/\/admin\/notifications$/);
    } else {
      await page.goto('/partner/activities?tab=approved');
      await expect(page.locator('.partner-tab-btn').nth(2)).toHaveClass(/is-active/);
      await page.reload();
      await expect(page.locator('.partner-tab-btn').nth(2)).toHaveClass(/is-active/);
      await page.locator('.partner-tab-btn').nth(1).click();
      await expect(page).toHaveURL(/tab=pending/);
      await page.goBack();
      await expect(page).toHaveURL(/tab=approved/);
      await expect(page.locator('.partner-tab-btn').nth(2)).toHaveClass(/is-active/);
    }
  });
}

test('every admin tab has a distinct path and supports legacy links', () => {
  expect(new Set(ADMIN_TABS.map(adminTabPath)).size).toBe(ADMIN_TABS.length);
  for (const tab of ADMIN_TABS) {
    expect(resolveAdminTab(adminTabPath(tab), '')).toBe(tab);
    expect(resolveAdminTab('/admin', `?tab=${tab}`)).toBe(tab);
  }
  expect(resolveAdminTab('/admin/unknown', '')).toBe('dashboard');
});
