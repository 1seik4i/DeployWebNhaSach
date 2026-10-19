import { expect, test } from '@playwright/test';

for (const partner of [false, true]) {
  test(`${partner ? 'partner' : 'admin'} registration accepts an uploaded image above 2000 characters`, async ({ page }) => {
    await page.route('**/event-image-test*', route => route.fulfill({
      contentType: 'text/html',
      body: '<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;</script><script type="module" src="/@vite/client"></script></head><body><div id="root"></div><script type="module" src="/tests/e2e/fixtures/activity-schedule.tsx"></script></body></html>',
    }));
    await page.goto(`/event-image-test${partner ? '?partner' : ''}`);
    const form = page.locator('[data-event-registration-form]');
    await form.locator('input[required]').first().fill('Event with uploaded image');
    await page.getByRole('textbox', { name: 'Start date', exact: true }).fill('20/10/2030');
    await page.getByRole('textbox', { name: 'End date', exact: true }).fill('21/10/2030');
    await form.locator('select[required]').selectOption('location');
    const upload = form.locator('input[type=file]');
    await upload.setInputFiles({ name: 'oversize.png', mimeType: 'image/png', buffer: Buffer.alloc(21 * 1024 * 1024) });
    await expect(form).toContainText('Event images must be 20 MB or smaller.');
    await expect(page.locator('output')).toHaveText('[]');
    const image = Buffer.concat([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS2kAAAAASUVORK5CYII=', 'base64'), Buffer.alloc(4096)]);
    await upload.setInputFiles({ name: 'event.png', mimeType: 'image/png', buffer: image });
    await expect(form.locator('img')).toHaveAttribute('src', /^data:image\/png;base64,/);
    if (partner) await page.getByLabel('I agree to the event registration terms.').check();
    await page.getByRole('button', { name: 'Register Event', exact: true }).click();
    await expect(page.locator('output')).toContainText('Event with uploaded image');
    const [registered] = JSON.parse(await page.locator('output').textContent() || '[]');
    expect(registered.thumbnail).toBe(`data:image/png;base64,${image.toString('base64')}`);
    expect(registered.thumbnail.length).toBeGreaterThan(2000);
  });
}
