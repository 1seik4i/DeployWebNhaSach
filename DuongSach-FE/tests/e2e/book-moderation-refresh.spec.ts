import { expect, test } from '@playwright/test';
import { signInRole } from './helpers';

test('admin sees a new partner submission without reloading the page', async ({ page, request }) => {
  await signInRole(page, 'admin');
  await page.getByRole('button', { name: 'Mặt bằng & Gian hàng', exact: true }).click();
  await page.getByRole('button', { name: 'Thư viện số', exact: true }).click();
  await page.locator('.admin-library-tabs').getByRole('button', { name: /Kiểm duyệt/ }).click();
  await expect(page.getByRole('columnheader', { name: 'Sách đề xuất' })).toBeVisible();
  // Finish the initial catalogue requests before creating the new submission.
  await page.waitForLoadState('networkidle');

  const login = await request.post('/api/auth/login', { data: {
    email: process.env.E2E_PARTNER_EMAIL || 'nxbtre@partner.duongsach.vn',
    password: process.env.E2E_PARTNER_PASSWORD || '123456',
  } });
  expect(login.ok()).toBeTruthy();
  const { data: session } = await login.json();
  const headers = { Authorization: `Bearer ${session.accessToken}` };
  const title = `E2E moderation refresh ${Date.now()}`;
  const submission = await request.post('/api/partner/book-submissions', { headers, data: {
    proposedData: { isbn: `E2E-${Date.now()}`, title, author: 'E2E', coverUrl: '/duong_sach_logo.png' },
    inventoryQuantity: 1,
  } });
  expect(submission.ok(), await submission.text()).toBeTruthy();
  const { data: created } = await submission.json();
  try {
    // A separate partner session writes to the real API: no window change event.
    const row = page.getByRole('row').filter({ hasText: title });
    await expect(row).toBeVisible({ timeout: 25000 });
    await expect(row).toContainText('Chờ duyệt');
    await row.getByRole('button', { name: 'Xem xét', exact: true }).click();
    await expect(page.getByRole('button', { name: /Phê duyệt|Duyệt yêu cầu/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Từ chối/ }).first()).toBeVisible();
  } finally {
    const cleanup = await request.delete(`/api/partner/book-submissions/${created.id}`, { headers });
    expect(cleanup.ok()).toBeTruthy();
  }
});
