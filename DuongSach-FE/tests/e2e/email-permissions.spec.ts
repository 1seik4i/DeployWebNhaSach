import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/email-permissions-test*', route => route.fulfill({
    contentType: 'text/html',
    body: '<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;</script><script type="module" src="/@vite/client"></script></head><body><div id="root"></div><script type="module" src="/tests/e2e/fixtures/email-permissions.tsx"></script></body></html>',
  }));
});

test('accounts paginate and fit the content width without horizontal scrolling', async ({ page, isMobile }) => {
  await page.goto('/email-permissions-test?many');
  const nav = page.getByRole('navigation', { name: 'Phân trang danh sách' });
  await expect(nav).toBeVisible();
  const content = page.locator(isMobile ? '.adm-user-mobile-cards' : '.adm-user-desktop-table');
  await expect(content.getByText('Account 1', { exact: true })).toBeVisible();
  await expect(content.getByText('Account 11', { exact: true })).toHaveCount(0);
  await nav.getByRole('button', { name: 'Trang 3', exact: true }).click();
  await expect(content.getByText('Account 25', { exact: true })).toBeVisible();
  await expect(nav.getByRole('button', { name: 'Trang sau', exact: true })).toBeDisabled();
  await nav.getByRole('button', { name: 'Trang trước', exact: true }).click();
  await expect(content.getByText('Account 11', { exact: true })).toBeVisible();
  const dimensions = await content.evaluate(element => ({ width: element.clientWidth, scroll: element.scrollWidth }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width + 1);
});

test('admin sees ellipsis for long contact and can save changed email', async ({ page }) => {
  await page.goto('/email-permissions-test');
  const contact = page.locator('.adm-contact-item span[title]:visible').first();
  await expect(contact).toBeVisible();
  const clipped = await contact.evaluate(element => ({ clipped: element.scrollWidth > element.clientWidth, overflow: getComputedStyle(element).textOverflow, title: element.getAttribute('title') }));
  expect(clipped.clipped).toBe(true);
  expect(clipped.overflow).toBe('ellipsis');
  expect(clipped.title).toContain('@example.test');
  await page.locator('button[title="Chỉnh sửa thông tin"]:visible').click();
  const email = page.getByLabel('Email', { exact: true });
  await expect(email).toBeEditable();
  await email.fill('updated@example.test');
  await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
  await expect(page.locator('output')).toContainText('updated@example.test');
});

test('partner email remains disabled during editing and is omitted on save', async ({ page }) => {
  await page.goto('/email-permissions-test?partner');
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(page.locator('input[type=email]')).toBeDisabled();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('output')).not.toHaveText('null');
  expect(JSON.parse(await page.locator('output').textContent() || '{}')).not.toHaveProperty('email');
});
