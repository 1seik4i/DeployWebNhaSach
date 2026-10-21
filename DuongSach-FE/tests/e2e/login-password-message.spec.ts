import { test, expect } from '@playwright/test';
for (const role of ['admin', 'partner']) {
  test(`${role} displays only the password validation message`, async ({ page }) => {
    let requests = 0;
    await page.route('**/api/**', route => {
      if (new URL(route.request().url()).pathname.endsWith('/auth/login')) {
        requests++;
        return route.fulfill({ status: 422, json: { success: false, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ', details: [{ field: 'password', message: 'Mật khẩu phải có ít nhất 8 ký tự' }] } } });
      }
      return route.fulfill({ json: { success: true, data: [] } });
    });
    await page.goto(`/${role}/login`);
    await page.locator(`#${role}-username`).fill(role === 'admin' ? 'admin@duongsach.example.vn' : 'nxbtre@partner.duongsach.vn');
    await page.locator(`#${role}-password`).fill('123456');
    await page.locator('button[type=submit]').click();
    await expect(page.getByText('Mật khẩu phải có ít nhất 8 ký tự', { exact: true })).toBeVisible();
    expect(requests).toBe(0);
    await page.locator(`#${role}-password`).fill('long-password');
    await page.locator('button[type=submit]').click();
    await expect.poll(() => requests).toBe(1);
    await expect(page.getByText('Mật khẩu phải có ít nhất 8 ký tự', { exact: true })).toBeVisible();
    await expect(page.getByText(/Dữ liệu không hợp lệ: password:/)).toHaveCount(0);
  });
}
