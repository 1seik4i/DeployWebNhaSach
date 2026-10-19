import { expect, test } from '@playwright/test';

test('portrait, square and landscape maps keep the same coordinate frame', async ({ page }) => {
  let dimensions = { width: 1600, height: 900 };
  await page.route('**/map-frame-test', route => route.fulfill({ contentType: 'text/html', body: '<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;</script></head><body><div id="root"></div><script type="module" src="/tests/e2e/fixtures/map-save.tsx"></script></body></html>' }));
  await page.route('**/api/public/map-hotspots', route => route.fulfill({ json: { success: true, data: [] } }));
  await page.route('**/api/public/map-config', route => route.fulfill({ json: { success: true, data: { imageUrl: '/test-map-shape.svg' } } }));
  await page.route('**/test-map-shape.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="${dimensions.width}" height="${dimensions.height}"><rect width="100%" height="100%" fill="green"/></svg>` }));
  let frameHeight: number | undefined;
  for (const shape of [{ width: 1600, height: 900 }, { width: 500, height: 1600 }, { width: 1000, height: 1000 }]) {
    dimensions = shape;
    await page.goto('/map-frame-test');
    const image = page.getByRole('img', { name: 'Bản đồ', exact: true });
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBe(shape.width);
    const box = await image.evaluate(el => ({ width: el.clientWidth, height: el.clientHeight, fit: getComputedStyle(el).objectFit, parentHeight: el.parentElement!.clientHeight }));
    expect(box.width / box.height).toBeCloseTo(16 / 9, 1);
    expect(box.fit).toBe('contain');
    expect(Math.abs(box.parentHeight - box.height)).toBeLessThanOrEqual(1);
    if (frameHeight !== undefined) expect(box.height).toBe(frameHeight);
    frameHeight = box.height;
  }
});
