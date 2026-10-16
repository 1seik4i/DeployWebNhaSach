import { expect, test } from '@playwright/test';

test('partner login in another tab does not change admin taxonomy permissions', async ({ page, context, request }) => {
  await page.goto('/admin');
  await page.locator('#admin-username').fill(process.env.E2E_ADMIN_EMAIL || 'admin@duongsach.example.vn');
  await page.locator('#admin-password').fill(process.env.E2E_ADMIN_PASSWORD || '123456');
  await page.getByRole('button', { name: 'Đăng nhập vào Hệ thống', exact: true }).click();
  await page.getByRole('button', { name: 'Mặt bằng & Gian hàng', exact: true }).click();
  await page.getByRole('button', { name: 'Thư viện số', exact: true }).click();
  await page.getByRole('button', { name: 'Danh mục & nhãn', exact: true }).click();

  const partner = await context.newPage();
  await partner.goto('/partner');
  await partner.locator('#partner-username').fill(process.env.E2E_PARTNER_EMAIL || 'nxbtre@partner.duongsach.vn');
  await partner.locator('#partner-password').fill(process.env.E2E_PARTNER_PASSWORD || '123456');
  await partner.getByRole('button', { name: 'Đăng nhập vào Cổng Đối tác', exact: true }).click();
  await expect(partner.locator('#partner-username')).not.toBeVisible();
  await page.bringToFront();

  const created: Array<{ path: string; id: string }> = [];
  const token = await page.evaluate(() => sessionStorage.getItem('duongsach_token'));
  try {
    for (const [index, path] of ['book-categories', 'book-labels'].entries()) {
      const name = `E2E tab isolation ${index} ${Date.now()}`;
      const section = page.locator('.admin-taxonomy-section').nth(index);
      await section.locator('input').fill(name);
      const response = page.waitForResponse(r => r.url().endsWith(`/admin/${path}`) && r.request().method() === 'POST');
      await section.getByRole('button', { name: /Thêm/ }).click();
      const result = await response;
      expect(result.ok(), await result.text()).toBeTruthy();
      const { data } = await result.json();
      created.push({ path, id: data.id });
      await page.getByRole('button', { name: 'Đã hiểu', exact: true }).click();
      await expect(section.getByText(name, { exact: true })).toBeVisible();
    }
    await page.reload();
    await expect(page.locator('#admin-username')).not.toBeVisible();
    expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('duongsach_user')!).primaryRole)).toBe('admin');
    expect(await partner.evaluate(() => JSON.parse(sessionStorage.getItem('duongsach_user')!).primaryRole)).toBe('partner');
  } finally {
    for (const row of created) {
      const result = await request.delete(`/api/admin/${row.path}/${row.id}?permanent=true`, { headers: { Authorization: `Bearer ${token}` } });
      expect(result.ok()).toBeTruthy();
    }
    await partner.close();
  }
});
