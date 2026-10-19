import { expect, test } from '@playwright/test';

test('invalid contact shows field error and blocks requests; valid phone, email and empty contact submit', async ({ page }) => {
  const submissions: Array<{ contactEmail?: string }> = [];
  await page.route('**/feedback-validation-test', route => route.fulfill({
    contentType: 'text/html',
    body: '<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;</script><script type="module" src="/@vite/client"></script></head><body><div id="root"></div><script type="module" src="/tests/e2e/fixtures/feedback-validation.tsx"></script></body></html>',
  }));
  await page.route('**/api/public/booths', route => route.fulfill({ json: { success: true, data: [] } }));
  await page.route('**/api/public/feedbacks', route => {
    submissions.push(route.request().postDataJSON());
    return route.fulfill({ json: { success: true, data: { id: 'feedback', status: 'new' } } });
  });
  await page.goto('/feedback-validation-test');
  await page.locator('#feedback-comment-input').fill('Test feedback');
  const contact = page.locator('#feedback-contact-input');
  const submit = page.locator('.sk05-submit-btn');
  for (const invalid of ['sdfs', '0123456789', '123', 'test@']) {
    await contact.fill(invalid);
    await expect(contact).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#feedback-contact-error')).toBeVisible();
    await expect(submit).toBeDisabled();
    // Enter must not bypass the submit guard.
    await contact.press('Enter');
    expect(submissions).toHaveLength(0);
  }
  for (const valid of ['0912345678', '+84912345678', 'name@example.com', '']) {
    await page.goto('/feedback-validation-test');
    await page.locator('#feedback-comment-input').fill('Test feedback');
    await contact.fill(valid);
    await expect(page.locator('#feedback-contact-error')).toHaveCount(0);
    await expect(submit).toBeEnabled();
    const response = page.waitForResponse('**/api/public/feedbacks');
    await submit.click();
    await response;
    expect(submissions.at(-1)?.contactEmail).toBe(valid || undefined);
  }
  expect(submissions).toHaveLength(4);
});
