import { expect, test } from '@playwright/test';
import { signInRole } from './helpers';

test('public event suggestions appear in the admin menu and can be processed', async ({ page, request }) => {
  await signInRole(page, 'admin');
  await page.getByRole('button', { name: 'Sự kiện & Hoạt động', exact: true }).click();
  await page.getByRole('button', { name: 'Đề xuất sự kiện', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Đề xuất sự kiện', exact: true })).toBeVisible();
  await page.waitForLoadState('networkidle');
  const content = `E2E public event suggestion ${Date.now()}`;
  const response = await request.post('/api/public/event-suggestions', { data: {
    fullName: 'Khách Kiểm Thử', phone: '0901234567', content,
  } });
  expect(response.ok()).toBeTruthy();
  const { data: created } = await response.json();
  try {
    const row = page.getByRole('row').filter({ hasText: content });
    await expect(row).toBeVisible({ timeout: 25000 });
    await row.getByRole('button', { name: 'Xem chi tiết' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('combobox', { name: 'Trạng thái', exact: true })).toHaveValue('new');
    await dialog.getByRole('combobox', { name: 'Trạng thái', exact: true }).selectOption('contacted');
    await dialog.getByLabel('Ghi chú xử lý').fill('Đã liên hệ người đề xuất để trao đổi thời gian.');
    const saved = page.waitForResponse(r => r.url().endsWith(`/event-suggestions/${created.id}`) && r.request().method() === 'PATCH');
    await dialog.getByRole('button', { name: 'Lưu xử lý' }).click();
    expect((await saved).ok()).toBeTruthy();
    await expect(dialog).not.toBeVisible();
    await page.goto('/admin?tab=event-suggestions');
    await expect(row).toContainText('Đã liên hệ');
    await expect(row).toContainText('Đã liên hệ người đề xuất để trao đổi thời gian.');
    await page.getByLabel('Tìm đề xuất').fill(content);
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await page.getByLabel('Lọc trạng thái').selectOption('new');
    await expect(row).toHaveCount(0);
    await page.getByLabel('Lọc trạng thái').selectOption('all');
    await page.getByLabel('Tìm đề xuất').fill('');
    await page.screenshot({ path: 'test-results/event-suggestions-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('heading', { name: 'Đề xuất sự kiện', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    await page.screenshot({ path: 'test-results/event-suggestions-mobile.png', fullPage: true });
  } finally {
    // Keep the audit trail and mark the test suggestion closed.
    const token = await page.evaluate(() => sessionStorage.getItem('duongsach_token'));
    const result = await request.patch(`/api/admin/event-suggestions/${created.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 'closed', internalNote: 'Automated regression test completed.' },
    });
    expect(result.ok()).toBeTruthy();
  }
});
