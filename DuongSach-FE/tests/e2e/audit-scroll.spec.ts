import { expect, test } from '@playwright/test';

test('audit table scrolls with a sticky header and stable pagination', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Mobile uses audit cards instead of the desktop table.');
  await page.addInitScript(() => {
    sessionStorage.setItem('duongsach_token', 'audit-test');
    sessionStorage.setItem('duongsach_user', JSON.stringify({ primaryRole: 'admin' }));
  });
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = [];
    if (path.endsWith('/profile')) data = { fullName: 'Admin', email: 'admin@example.test' };
    if (path.endsWith('/settings')) data = [{ key: 'admin.system', value: {} }];
    if (path.endsWith('/dashboard')) data = { usersByRole: {}, auditByDay: [] };
    if (path.endsWith('/audit-logs')) data = Array.from({ length: 60 }, (_, index) => ({
      id: `log-${index}`, createdAt: '2026-10-19T01:00:00Z', actor: { fullName: 'Test administrator', email: 'admin@example.test' },
      action: 'create', targetType: 'Event', details: `Audit record ${index}`, ipAddress: '127.0.0.1',
    }));
    await route.fulfill({ json: { success: true, data } });
  });
  await page.goto('/admin/audit');
  const table = page.getByRole('region', { name: 'Bảng nhật ký hệ thống' });
  await expect(table).toBeVisible();
  await page.locator('.adm-pagesize-select').selectOption('50');
  const footer = page.locator('.adm-audit-table-card > .adm-pagination-bar');
  await footer.scrollIntoViewIfNeeded();
  const before = await footer.boundingBox();
  const result = await table.evaluate(element => {
    element.scrollTop = 300;
    const header = element.querySelector('th')!;
    return { scroll: element.scrollTop, scrollable: element.scrollHeight > element.clientHeight,
      headerTop: header.getBoundingClientRect().top, tableTop: element.getBoundingClientRect().top };
  });
  expect(result.scrollable).toBe(true);
  expect(result.scroll).toBeGreaterThan(0);
  expect(Math.abs(result.headerTop - result.tableTop)).toBeLessThan(3);
  expect((await footer.boundingBox())?.y).toBe(before?.y);
  await footer.getByRole('button', { name: 'Sau', exact: true }).click();
  await expect(footer.locator('.pagination-info')).toContainText('2');
});
