import { expect, test } from '@playwright/test';
import { signInRole } from './helpers';

test.describe('Admin và Partner', () => {
  test('participant và trang đăng ký độc giả cũ không còn cổng riêng', async ({ page }) => {
    for (const route of ['/participant', '/participant/events', '/register']) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/$/);
    }
  });

  test('trang đăng nhập chung dùng tài khoản thật', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Đăng nhập hệ thống' })).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel('Mật khẩu', { exact: true })).toBeVisible();
  });

  test('Partner có cổng riêng và không vào Admin', async ({ page }) => {
    await signInRole(page, 'partner');
    await expect(page).toHaveURL(/\/partner$/);
    await expect(page.locator('body')).toContainText(/Đối tác|gian hàng/i);
    await page.goto('/admin');
    await expect(page.locator('body')).not.toContainText('Sự kiện & Hoạt động');
  });

  test('đường dẫn organizer cũ chuyển đến Admin', async ({ page }) => {
    await page.goto('/organizer');
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { name: 'Cổng Quản Trị Hệ Thống' })).toBeVisible();
  });

  test('admin chứa chức năng điều hành sự kiện và hoạt động', async ({ page }) => {
    await signInRole(page, 'admin');
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByText('Sự kiện & Hoạt động').first()).toBeAttached();
    await expect(page.getByText('Mặt bằng & Gian hàng').first()).toBeAttached();
    await expect(page.getByText('Báo cáo & Đóng góp').first()).toBeAttached();
  });
});
