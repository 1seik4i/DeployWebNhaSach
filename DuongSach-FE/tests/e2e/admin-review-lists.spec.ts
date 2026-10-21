import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  const suggestions = [
    { id: 'idea', fullName: 'Nguyễn Minh', phone: '0901234567', content: '[ĐỀ XUẤT SỰ KIỆN]: Ngày đọc sách\nGiao lưu cùng tác giả.', status: 'new', createdAt: '2026-10-21T01:00:00Z' },
    { id: 'old', fullName: 'Trần An', phone: '0901234568', content: 'Tọa đàm văn học', status: 'approved', createdAt: '2026-10-20T01:00:00Z' },
  ];
  const applications = [
    { id: 'application', eventId: 'event', event: { title: 'Ngày hội đọc sách' }, organization: { name: 'Nhà xuất bản Trẻ', representativeName: 'Nguyễn Minh', phone: '0901234567', email: 'minh@example.test' }, status: 'submitted', submittedAt: '2026-10-21T01:00:00Z', participationRole: 'participant' },
    { id: 'approved', eventId: 'event', event: { title: 'Ngày hội đọc sách' }, organization: { name: 'Nhà sách Minh', representativeName: 'Trần An', phone: '0901234568' }, status: 'approved', submittedAt: '2026-10-20T01:00:00Z', participationRole: 'organizer' },
  ];
  await page.route('**/api/admin/**', route => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('/event-suggestions')) {
      if (route.request().method() === 'PATCH') {
        const index = suggestions.findIndex(row => row.id === url.pathname.split('/').at(-1));
        suggestions[index] = { ...suggestions[index], ...route.request().postDataJSON() };
        return route.fulfill({ json: { success: true, data: suggestions[index] } });
      }
      return route.fulfill({ json: { success: true, data: suggestions } });
    }
    if (url.pathname.includes('/partner-applications')) {
      if (route.request().method() === 'POST') {
        const parts = url.pathname.split('/');
        const row = applications.find(row => row.id === parts.at(-2))!;
        row.status = parts.at(-1) === 'approve' ? 'approved' : 'rejected';
        return route.fulfill({ json: { success: true, data: row } });
      }
      return route.fulfill({ json: { success: true, data: applications } });
    }
    return route.fulfill({ status: 404 });
  });
  await page.route('**/admin-review-lists-test*', route => route.fulfill({ contentType: 'text/html', body: '<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;</script></head><body><div id="root"></div><script type="module" src="/tests/e2e/fixtures/admin-review-lists.tsx"></script></body></html>' }));
});

test('suggestions retain search, filters and status updates in the new layout', async ({ page, isMobile }) => {
  await page.goto('/admin-review-lists-test');
  const row = page.getByRole('row').filter({ hasText: 'Ngày đọc sách' });
  await row.getByRole('button', { name: 'Xem chi tiết' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Trạng thái', { exact: true }).selectOption('contacted');
  await dialog.getByLabel('Ghi chú xử lý').fill('Đã liên hệ người gửi.');
  await dialog.getByRole('button', { name: 'Lưu xử lý' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(row).toContainText('Đã liên hệ');
  await expect(row).toContainText('Đã liên hệ người gửi.');
  if (!isMobile) {
    const x = await page.locator('tbody tr').evaluateAll(rows => rows.map(row => Array.from(row.children).map(cell => Math.round(cell.getBoundingClientRect().left))));
    expect(x[0]).toEqual(x[1]);
  }
  await page.getByLabel('Tìm đề xuất').fill('Nguyễn Minh');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByLabel('Lọc trạng thái').selectOption('new');
  await expect(page.locator('tbody tr')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test('participation applications show details, approve correctly and preserve partner roles', async ({ page }) => {
  await page.goto('/admin-review-lists-test?mode=applications');
  await page.getByRole('button', { name: 'Chi tiết', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('minh@example.test');
  await dialog.getByRole('button', { name: 'Duyệt đơn', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Xác nhận duyệt', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('tbody tr')).toHaveCount(0);
  await page.getByRole('button', { name: /^Đã duyệt/ }).click();
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await expect(page.getByRole('row').filter({ hasText: 'Nhà sách Minh' })).toContainText('Đối tác tổ chức');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test('rejection still requires a reason and sends it with the review', async ({ page }) => {
  await page.goto('/admin-review-lists-test?mode=applications');
  await page.getByRole('button', { name: 'Từ chối Nhà xuất bản Trẻ' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Xác nhận từ chối' })).toBeDisabled();
  await dialog.getByLabel('Lý do từ chối (bắt buộc)').fill('Thông tin tham gia chưa phù hợp.');
  const request = page.waitForRequest(req => req.url().endsWith('/application/reject'));
  await dialog.getByRole('button', { name: 'Xác nhận từ chối' }).click();
  expect((await request).postDataJSON()).toEqual({ note: 'Thông tin tham gia chưa phù hợp.' });
  await expect(dialog).toHaveCount(0);
});
