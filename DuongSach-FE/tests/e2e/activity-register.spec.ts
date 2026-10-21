import { expect, test } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.route('**/api/admin/activity-proposals/**', route => route.fulfill({ json: { success: true, data: {} } }));
  await page.route('**/activity-register-test', route => route.fulfill({ contentType: 'text/html', body: '<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;</script></head><body><div id="root"></div><script type="module" src="/tests/e2e/fixtures/activity-register.tsx"></script></body></html>' }));
  await page.goto('/activity-register-test');
});
test('shows one entry per activity and inherits its event image', async ({ page, isMobile }) => {
  await expect(page.locator('.ar-row')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Chương trình đọc sách', exact: true })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Tạo HĐ', exact: true })).toHaveCount(0);
  await expect(page.locator('.ar-identity > img')).toHaveCount(3);
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.width + 1);
  if (!isMobile) {
    const alignment = await page.locator('.ar-row').evaluateAll(rows => rows.map(row => ({
      columns: Array.from(row.children).map(cell => Math.round(cell.getBoundingClientRect().left)),
      buttons: Array.from(row.querySelectorAll('.ar-actions button')).map(button => Math.round(button.getBoundingClientRect().top)),
    })));
    for (const row of alignment) {
      expect(row.columns).toEqual(alignment[0].columns);
      expect(new Set(row.buttons).size).toBe(1);
    }
  }
});
test('approval immediately moves a proposal into approved activities with no create step', async ({ page }) => {
  const row = page.locator('[data-activity-id="proposal:pending"]');
  await row.getByRole('button', { name: 'Duyệt', exact: true }).click();
  await expect(page.locator('[data-activity-id="activity:approved-pending"]')).toContainText('Trong lịch hoạt động');
  await expect(page.locator('[data-activity-id="proposal:pending"]')).toHaveCount(0);
  await expect(page.locator('.ar-row')).toHaveCount(3);
});
test('detail shows the synchronized image and permits approval after requesting revision', async ({ page }) => {
  await page.locator('[data-activity-id="proposal:revision"]').getByRole('button', { name: 'Chi tiết', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('.ar-detail-cover')).toBeVisible();
  await dialog.getByLabel('Ghi chú cho đối tác').fill('Đã bổ sung đủ thông tin.');
  const request = page.waitForRequest(req => req.url().includes('/revision/approve'));
  await dialog.getByRole('button', { name: 'Duyệt hoạt động', exact: true }).click();
  expect((await request).postDataJSON()).toMatchObject({ note: 'Đã bổ sung đủ thông tin.' });
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('[data-activity-id="activity:approved-revision"]')).toBeVisible();
});
