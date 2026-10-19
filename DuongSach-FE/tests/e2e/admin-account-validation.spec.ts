import { expect, test } from '@playwright/test';
import { signInRole } from './helpers';

test('admin validates account contacts and can edit partner email', async ({ page }) => {
  await signInRole(page, 'admin');
  const mobile = (page.viewportSize()?.width || 1440) <= 768;
  if (mobile) await page.getByRole('button', { name: 'Danh sách người dùng' }).click();
  else {
    await page.getByText('Tài khoản & Phân quyền').first().click();
    await page.getByText('Quản lý người dùng').first().click();
  }
  await page.getByRole('button', { name: /Thêm tài khoản/ }).click();
  const create = page.locator('.adm-modal-content').first();
  await create.locator('input[type="text"]').first().fill('Nguyễn Văn An');
  await create.locator('input[type="email"]').fill('new-partner@example.test');
  await create.locator('input[type="tel"]').fill('12345');
  await create.locator('input[type="password"]').first().fill('Test-pass-123!');
  await create.locator('input[type="password"]').nth(1).fill('Test-pass-123!');
  await create.getByRole('button', { name: 'Tạo tài khoản' }).click();
  await expect(create.getByRole('alert')).toContainText('số điện thoại');

  await create.getByRole('button', { name: /Đóng thêm tài khoản/ }).click();
  await (mobile
    ? page.locator('.adm-user-mobile-card .adm-card-action-btn').first()
    : page.locator('.adm-user-desktop-table .adm-icon-btn').first()).click();
  const edit = page.locator('.adm-modal-content').first();
  await expect(edit.locator('input[type="email"]')).toBeEnabled();
  await expect(edit.locator('.adm-modal-title')).toContainText(/[0-9a-f]{8}-[0-9a-f-]{27}/i);
});
