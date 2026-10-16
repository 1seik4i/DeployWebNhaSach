import { expect, test } from '@playwright/test';
for (const kind of ['books', 'booths', 'locations', 'venues']) {
  test(`scanned ${kind} link displays public details without login`, async ({ page }) => {
    await page.route('**/api/**', route => route.fulfill({ json: { success: true, data: [] } }));
    await page.route(`**/api/public/${kind}/scan-test`, route => route.fulfill({ json: { success: true, data: { id: 'scan-test', name: 'Thông tin kiểm thử QR', title: 'Thông tin kiểm thử QR', description: 'Mô tả chi tiết công khai', capacity: 50 } } }));
    await page.goto(`/thong-tin/${kind}/scan-test`);
    await expect(page.getByRole('heading', { name: 'Thông tin kiểm thử QR', exact: true })).toBeVisible();
    await expect(page.getByText('Mô tả chi tiết công khai', { exact: true })).toBeVisible();
  });
}
test('QR modal links to detail and offers a PNG download only for admin', async ({ page }) => {
  await page.route('**/modal-test', route => route.fulfill({ contentType: 'text/html', body: '<html lang="vi"><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><script type="module">import R from "/@react-refresh";R.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>t=>t;window.__vite_plugin_react_preamble_installed__=true;</script></head><body><div id="root"></div><script type="module" src="/tests/e2e/fixtures/notification-modal.tsx"></script></body></html>' }));
  await page.goto('/modal-test');
  await page.getByRole('button', { name: 'Mã QR: Sách kiểm thử', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('canvas')).toBeVisible();
  await expect(dialog.getByRole('link')).toHaveAttribute('href', 'http://127.0.0.1:4173/thong-tin/books/test-book');
  const downloadPromise = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Tải mã QR (PNG)', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('QR-books-test-book.png');
  expect(await download.failure()).toBeNull();
  expect((await dialog.boundingBox())!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Mã QR: Gian hàng công khai', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Tải mã QR (PNG)', exact: true })).toHaveCount(0);
});
