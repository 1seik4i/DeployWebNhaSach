import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('changing the image leaves the 39 existing marker positions untouched', async ({ page }) => {
  let payload: { imageUrl: string; points: unknown[] } | undefined;
  await page.route('**/map-image-only-test', route => route.fulfill({ contentType: 'text/html', body: '<html><head><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;</script></head><body><div id="root"></div><script type="module" src="/tests/e2e/fixtures/map-image-only.tsx"></script></body></html>' }));
  await page.route('**/api/public/map-hotspots', route => route.fulfill({ json: { success: true, data: Array.from({ length: 39 }, (_, i) => ({ id: `booth-${i}`, name: `Booth ${i}`, x: i, y: 25 })) } }));
  await page.route('**/api/public/map-config', route => route.fulfill({ json: { success: true, data: { imageUrl: '/old-map.png' } } }));
  await page.route('**/api/admin/map-config', route => {
    payload = route.request().postDataJSON();
    return route.fulfill({ json: { success: true, data: {} } });
  });
  await page.goto('/map-image-only-test');
  await page.getByRole('button', { name: 'Save image' }).click();
  await expect(page.locator('output')).toHaveText('Saved');
  expect(payload).toEqual({ imageUrl: '/new-map.png', points: [] });
});

test('map upload stays a draft until Save; failed Save keeps draft; large images are accepted', async ({ page }, testInfo) => {
  let imageUrl = '/saved-map.png';
  let failSave = true;
  const writes: Array<{ imageUrl: string; points: unknown[] }> = [];
  await page.route('**/map-save-test', route => route.fulfill({
    contentType: 'text/html',
    body: '<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;</script><script type="module" src="/@vite/client"></script></head><body><div id="root"></div><script type="module" src="/tests/e2e/fixtures/map-save.tsx"></script></body></html>',
  }));
  await page.route('**/api/public/map-hotspots', route => route.fulfill({ json: { success: true, data: [] } }));
  await page.route('**/api/public/map-config', route => route.fulfill({ json: { success: true, data: { imageUrl } } }));
  await page.route('**/api/admin/map-config', route => {
    const input = route.request().postDataJSON();
    writes.push(input);
    if (failSave) return route.fulfill({ status: 500, json: { success: false, error: { message: 'Save failed' } } });
    imageUrl = input.imageUrl;
    return route.fulfill({ json: { success: true, data: { imageUrl } } });
  });
  const file = {
    name: 'map.png', mimeType: 'image/png',
    buffer: Buffer.concat([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS2kAAAAASUVORK5CYII=', 'base64'), Buffer.alloc(4 * 1024 * 1024)]),
  };
  const preview = page.locator('img').first();
  const upload = page.locator('input[type=file]').first();
  const save = page.locator('.booth-map-btn-save');
  await page.goto('/map-save-test');
  await expect(preview).toHaveAttribute('src', '/saved-map.png');
  await upload.setInputFiles(process.env.MAP_TEST_IMAGE_PATH || file);
  await expect(preview).toHaveAttribute('src', /^data:image\/png;base64,/);
  expect(writes).toHaveLength(0);
  await page.evaluate(() => window.dispatchEvent(new Event('duongsach:data-changed')));
  await expect(preview).toHaveAttribute('src', /^data:image\/png;base64,/);
  await page.reload();
  await expect(preview).toHaveAttribute('src', '/saved-map.png');
  await upload.setInputFiles(process.env.MAP_TEST_IMAGE_PATH || file);
  await expect(save).toBeEnabled();
  await save.click();
  await expect(page.getByRole('dialog')).toContainText('Save failed');
  await page.getByRole('dialog').getByRole('button').last().click();
  await expect(preview).toHaveAttribute('src', /^data:image\/png;base64,/);
  expect(imageUrl).toBe('/saved-map.png');
  failSave = false;
  await save.click();
  await expect(save).toHaveClass(/is-saved/);
  expect(writes).toHaveLength(2);
  expect(writes[1].points).toEqual([]);
  expect(writes[1].imageUrl.length).toBeGreaterThan(3000000);
  await page.reload();
  await expect(preview).toHaveAttribute('src', imageUrl);
  const oversizedPath = testInfo.outputPath('oversize.png');
  await writeFile(oversizedPath, Buffer.alloc(51 * 1024 * 1024));
  await upload.setInputFiles(oversizedPath);
  await expect(page.getByRole('dialog')).toContainText('50 MB');
  expect(writes).toHaveLength(2);
});
