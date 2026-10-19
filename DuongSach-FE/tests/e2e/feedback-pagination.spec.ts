import { expect, test } from '@playwright/test';

test('report reviews support numbered pages and previous/next', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('duongsach_token', 'pagination-test');
    sessionStorage.setItem('duongsach_user', JSON.stringify({ primaryRole: 'admin' }));
  });
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = [];
    if (path.endsWith('/profile')) data = { id: 'admin', fullName: 'Admin', email: 'admin@example.test' };
    if (path.endsWith('/dashboard')) data = { usersByRole: {}, auditByDay: [] };
    if (path === '/api/admin/settings') data = [{ key: 'admin.system', value: {} }];
    if (path === '/api/admin/events') data = [{ id: 'event-1', title: 'Review event', startAt: '2026-10-20T09:00:00+07:00', endAt: '2026-10-20T17:00:00+07:00', status: 'published' }];
    if (path === '/api/admin/reports') data = {
      eventId: 'event-1', eventName: 'Review event', totalParticipants: 0, totalBooths: 0, totalActivities: 0,
      attended: 0, pending: 0, cancelled: 0, attendanceRate: 0, averageRating: 5, ratingCount: 21,
      activityStats: [], ratingDistribution: [], feedbacks: Array.from({ length: 21 }, (_, index) => ({
        id: `review-${index}`, source: 'event', rating: 5, authorName: 'Reader', comment: `Review comment ${index + 1}`, createdAt: '2026-10-19T01:00:00Z',
      })),
    };
    await route.fulfill({ json: { success: true, data } });
  });
  await page.goto('/admin/reports');
  const nav = page.getByRole('navigation', { name: 'Phân trang danh sách' });
  await expect(page.getByText('Review comment 1', { exact: true })).toBeVisible();
  await expect(page.getByText('Review comment 11', { exact: true })).toHaveCount(0);
  await nav.getByRole('button', { name: 'Trang 3', exact: true }).click();
  await expect(page.getByText('Review comment 21', { exact: true })).toBeVisible();
  await expect(nav.getByRole('button', { name: 'Trang sau', exact: true })).toBeDisabled();
  await nav.getByRole('button', { name: 'Trang trước', exact: true }).click();
  await expect(page.getByText('Review comment 11', { exact: true })).toBeVisible();
});

test('feedback pagination reaches records beyond the first API page and resets on search', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('duongsach_token', 'pagination-test');
    sessionStorage.setItem('duongsach_user', JSON.stringify({ primaryRole: 'admin' }));
  });
  const requested: number[] = [];
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    let data: unknown = [];
    if (url.pathname.endsWith('/profile')) data = { id: 'admin', fullName: 'Admin', email: 'admin@example.test' };
    if (url.pathname.endsWith('/dashboard')) data = { usersByRole: {}, auditByDay: [] };
    if (url.pathname === '/api/admin/feedbacks') {
      const current = Number(url.searchParams.get('page') || 1);
      requested.push(current);
      data = Array.from({ length: 101 }, (_, index) => ({ id: `feedback-${index}`, subject: `Feedback item ${index + 1}`, comments: 'Reader comment', status: 'new', rating: 5, fullName: 'Reader', createdAt: '2026-10-19T01:00:00Z' })).slice((current - 1) * 100, current * 100);
    }
    await route.fulfill({ json: { success: true, data } });
  });
  await page.goto('/admin/feedback');
  const nav = page.getByRole('navigation', { name: 'Phân trang danh sách' });
  await expect(nav).toBeVisible();
  expect(requested).toContain(2);
  await expect(nav.locator('.list-pagination-number button')).toHaveText(['1', '2', '11']);
  await expect(nav.getByText('…', { exact: true })).toHaveCount(1);
  await expect(page.getByText('Feedback item 1', { exact: true })).toBeVisible();
  await expect(page.getByText('Feedback item 11', { exact: true })).toHaveCount(0);
  await expect(nav.getByRole('button', { name: 'Trang trước', exact: true })).toBeDisabled();
  await nav.getByRole('button', { name: 'Trang sau', exact: true }).click();
  await expect(page.getByText('Feedback item 11', { exact: true })).toBeVisible();
  for (let next = 3; next <= 5; next++) {
    await nav.getByRole('button', { name: 'Trang sau', exact: true }).click();
  }
  await expect(nav.locator('.list-pagination-number button')).toHaveText(['1', '4', '5', '6', '11']);
  await expect(nav.getByText('…', { exact: true })).toHaveCount(2);
  await expect(nav.locator('[aria-current="page"]')).toHaveText('5');
  await nav.getByRole('button', { name: 'Trang 11', exact: true }).click();
  await expect(page.getByText('Feedback item 101', { exact: true })).toBeVisible();
  await expect(nav.locator('.list-pagination-number button')).toHaveText(['1', '10', '11']);
  await expect(nav.getByText('…', { exact: true })).toHaveCount(1);
  await expect(nav.getByRole('button', { name: 'Trang sau', exact: true })).toBeDisabled();
  await nav.getByRole('button', { name: 'Trang trước', exact: true }).click();
  await expect(page.getByText('Feedback item 91', { exact: true })).toBeVisible();
  await page.getByPlaceholder('Tìm nội dung, người gửi...').fill('Feedback item 101');
  await expect(page.getByText('Feedback item 101', { exact: true })).toBeVisible();
  await expect(nav).toHaveCount(0);
});
