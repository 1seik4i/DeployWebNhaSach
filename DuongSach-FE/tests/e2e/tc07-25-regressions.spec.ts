import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const content = JSON.parse(readFileSync(new URL('./fixtures/tc-content.json', import.meta.url), 'utf8'));
const book = { id: 'book-10', isbn: '9781234567890', title: 'Sách kiểm thử', titleEn: 'Test Book', publisher: null, description: null, publicationYear: null, author: 'Author', coverUrl: '/duong_sach_logo.png', status: 'active', updatedAt: '2026-10-21T00:00:00Z', bestsellerRank: 10 };
const stall = { id: 'stock', bookId: book.id, stallId: 'stall', stallName: 'Test Stall', inventoryQuantity: 12, soldQuantity: null, availabilityStatus: 'available' };
const html = (fixture: string) => `<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;</script><script type="module" src="/@vite/client"></script></head><body><div id="root"></div><script type="module" src="/tests/e2e/fixtures/${fixture}.tsx"></script></body></html>`;

test.beforeEach(async ({ page }) => {
  await page.route('**/tc-regressions-test*', route => route.fulfill({ contentType: 'text/html', body: html('tc-regressions') }));
  await page.route('**/feedback-validation-test', route => route.fulfill({ contentType: 'text/html', body: html('feedback-validation') }));
  await page.route('**/api/public/content', route => route.fulfill({ json: { success: true, data: content } }));
  await page.route('**/api/public/booths', route => route.fulfill({ json: { success: true, data: [] } }));
});

test('TC07: invalid 11-digit mobile stays in form, shows field error and sends no request', async ({ page }) => {
  let requests = 0;
  await page.route('**/api/public/event-suggestions', route => { requests++; return route.fulfill({ json: { success: true, data: {} } }); });
  await page.goto('/feedback-validation-test');
  await page.getByRole('button', { name: /Đề xuất sự kiện/i }).click();
  await page.locator('input').filter({ visible: true }).first().fill('Sự kiện thử nghiệm');
  await page.locator('textarea').fill('Nội dung sự kiện thử nghiệm');
  await page.getByPlaceholder('Nguyễn Văn A').fill('Nguyễn Văn A');
  await page.getByPlaceholder('0901 234 567').fill('09123456789');
  await page.getByPlaceholder('contact@domain.com').fill('test@example.com');
  await page.locator('.event-btn').click();
  await expect(page.locator('#proposal-phone-error')).toBeVisible();
  await expect(page.getByPlaceholder('0901 234 567')).toHaveValue('09123456789');
  expect(requests).toBe(0);
  await page.getByPlaceholder('0901 234 567').fill('0912345678');
  await page.locator('.event-btn').click();
  await expect.poll(() => requests).toBe(1);
});

test('TC09/13: rank 10 does not overlap its cover and homepage cover labels use English', async ({ page }) => {
  await page.route('**/api/public/books', route => route.fulfill({ json: { success: true, data: [book] } }));
  await page.route('**/api/public/book-rankings', route => route.fulfill({ json: { success: true, data: { bestsellers: [book], weeklyHot: [], configuration: {} } } }));
  await page.goto('/tc-regressions-test?mode=ranking');
  const rank = page.locator('.library-ranking-number');
  await expect(rank).toHaveText('10');
  const a = await rank.boundingBox(); const b = await page.locator('.library-cover-art').boundingBox();
  expect(a!.x + a!.width).toBeLessThanOrEqual(b!.x);
  await expect(page.locator('.library-cover-title')).toHaveText('Test Book');
  await expect(page.locator('.library-cover-imprint')).toHaveText('HCMC BOOK STREET');
});

test('TC10/23: organization uses translated CMS content and the actual governance count', async ({ page }) => {
  await page.goto('/tc-regressions-test?mode=organization');
  await expect(page.locator('.org-hero-title')).toContainText('Governance & Executive Board');
  await expect(page.locator('.org-tree-role').first()).toContainText('Chair');
  await expect(page.locator('.org-section-heading')).toHaveText('3 Governance Pillars');
  await expect(page.locator('.org-principle-title').first()).toHaveText('Professionalism & Dedicated Service');
});

test('TC11: journey translates hero, milestones and mission content', async ({ page }) => {
  await page.goto('/tc-regressions-test?mode=journey');
  await expect(page.getByText('A Journey of', { exact: true })).toBeVisible();
  await expect(page.getByText('Shaping the Future of Reading', { exact: true })).toBeAttached();
  await expect(page.getByText('Opening of HCMC Book Street', { exact: true })).toBeAttached();
});

test('TC08/14: unavailable external image resolves to a loaded local fallback', async ({ page }) => {
  await page.goto('/tc-regressions-test?mode=image');
  const image = page.getByAltText('Test image');
  await expect(image).toHaveAttribute('src', '/duong_sach_logo.png');
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
});

test('TC17–21: modal stays open, URL opens, stock uses one patch, approved submissions leave queue', async ({ page }) => {
  const patches: unknown[] = [];
  await page.route('**/api/partner/books', route => route.fulfill({ json: { success: true, data: [{ book: { ...book, coverUrl: 'https://example.com/cover.jpg' }, stall, contentStatus: 'APPROVED' }] } }));
  await page.route('**/api/public/book-categories', route => route.fulfill({ json: { success: true, data: [] } }));
  await page.route('**/api/partner/book-submissions', route => route.fulfill({ json: { success: true, data: [
    { id: 'approved', status: 'APPROVED', type: 'CREATE', proposedData: { title: 'Already approved' } },
    { id: 'pending', status: 'PENDING', type: 'CREATE', proposedData: { title: 'Awaiting review' } },
  ] } }));
  await page.route('**/api/partner/books/*/quantities', route => { patches.push(route.request().postDataJSON()); return route.fulfill({ json: { success: true, data: stall } }); });
  await page.goto('/tc-regressions-test?mode=books');
  await page.getByRole('button', { name: /Cập nhật tồn kho|Sửa sách|Chỉnh sửa sách|Sửa tồn kho/ }).filter({ visible: true }).first().click();
  const form = page.locator('.partner-book-form');
  await expect(form).toBeVisible();
  await page.locator('.partner-book-modal').click({ position: { x: 2, y: 2 }, force: true });
  await expect(form).toBeVisible();
  await expect(form.getByRole('link', { name: 'Mở ảnh trong thẻ mới' })).toHaveAttribute('href', 'https://example.com/cover.jpg');
  await form.getByLabel('Số lượng sách đưa vào kho *', { exact: true }).fill('8');
  await form.locator('button[type=submit]').click();
  await expect.poll(() => patches.length).toBe(1);
  expect(patches[0]).toEqual({ inventoryQuantity: 8 });
  await page.locator('.partner-notice-btn').click();
  await page.getByRole('button', { name: /Yêu cầu gửi duyệt/ }).click();
  await expect(page.getByText('Already approved')).toHaveCount(0);
  await expect(page.getByText('Awaiting review').filter({ visible: true }).first()).toBeVisible();
});

test('TC20: an open calendar disables yesterday after Vietnam midnight', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-21T23:59:30+07:00') });
  await page.goto('/tc-regressions-test?mode=dates');
  await page.getByRole('button', { name: 'Chọn ngày bắt đầu' }).click();
  const yesterday = page.getByRole('button', { name: '21/10/2026', exact: true });
  await expect(yesterday).toBeEnabled();
  await page.clock.runFor(31000);
  await expect(yesterday).toBeDisabled();
  await expect(page.getByRole('button', { name: '22/10/2026', exact: true })).toBeEnabled();
});
