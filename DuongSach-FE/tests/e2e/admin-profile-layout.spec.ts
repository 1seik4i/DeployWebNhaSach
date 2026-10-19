import { expect, test } from '@playwright/test';

test('admin profile fits laptop screens including edit mode', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop layout');
  await page.route('**/admin-profile-layout-test', route => route.fulfill({ contentType: 'text/html', body: '<html><head><style>body{margin:0}</style><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;</script></head><body><div id="root"></div><script type="module" src="/tests/e2e/fixtures/admin-profile.tsx"></script></body></html>' }));
  for (const size of [{ width: 1366, height: 768 }, { width: 1280, height: 720 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(size);
    await page.goto('/admin-profile-layout-test');
    await expect(page.getByRole('button', { name: 'Đổi mật khẩu', exact: true })).toBeVisible();
    for (const editing of [false, true]) {
      if (editing) await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
      const dimensions = await page.locator('main').evaluate(el => ({ height: el.clientHeight, scrollHeight: el.scrollHeight, width: el.clientWidth, scrollWidth: el.scrollWidth }));
      expect(dimensions.scrollHeight, JSON.stringify({ size, editing, dimensions })).toBeLessThanOrEqual(dimensions.height + 1);
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width + 1);
    }
  }
});
