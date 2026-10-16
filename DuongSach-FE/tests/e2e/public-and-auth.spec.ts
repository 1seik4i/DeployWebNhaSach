import { expect, test } from '@playwright/test';
import { expectHealthyPage, expectImagesLoaded, trackRuntimeErrors } from './helpers';

test.describe('Giao diện công khai và dữ liệu API', () => {
  test('trang chủ hiển thị dữ liệu, ảnh local và nút xóa tìm kiếm hoạt động', async ({ page }) => {
    const errors = trackRuntimeErrors(page);
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /Chào mừng đến với/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Các gian hàng tại Đường Sách/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Sự kiện sắp diễn ra tại Đường Sách/i })).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/dữ liệu giả|dữ liệu mẫu/i);

    const search = page.getByPlaceholder('Tìm kiếm ki-ốt, nhà xuất bản, tên sách...');
    await search.fill('NXB Trẻ');
    const clearButton = page.getByRole('button', { name: 'Xóa tìm kiếm' });
    await expect(clearButton).toBeEnabled();
    await clearButton.click();
    await expect(search).toHaveValue('');
    await expect(search).toBeFocused();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    await expectImagesLoaded(page);
    await expectHealthyPage(page, errors);
  });

  for (const route of ['/gian-hang', '/su-kien']) {
    test(`${route} mở được và không có ảnh lỗi`, async ({ page }) => {
      const errors = trackRuntimeErrors(page);
      await page.goto(route);
      await expect(page.locator('body')).toContainText(/Đường Sách/i);
      await expectImagesLoaded(page);
      await expectHealthyPage(page, errors);
    });
  }
});

test.describe('Truy cập quản trị', () => {
  test('admin chưa đăng nhập được chuyển đến trang đăng nhập quản trị', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { name: 'Cổng Quản Trị Hệ Thống' })).toBeVisible();
  });
});
