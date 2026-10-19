import { expect, test } from '@playwright/test';

test('both date fields open a calendar and select dates in dd/mm/yyyy', async ({ page }) => {
  await page.route('**/activity-schedule-test', route => route.fulfill({
    contentType: 'text/html',
    body: '<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;</script><script type="module" src="/@vite/client"></script></head><body><div id="root"></div><script type="module" src="/tests/e2e/fixtures/activity-schedule.tsx"></script></body></html>',
  }));
  await page.goto('/activity-schedule-test');
  const start = page.getByRole('textbox', { name: 'Start date', exact: true });
  const end = page.getByRole('textbox', { name: 'End date', exact: true });
  await start.click();
  const startCalendar = page.getByRole('group', { name: 'Calendar for start date', exact: true });
  await expect(startCalendar).toBeVisible();
  await startCalendar.getByLabel('Year', { exact: true }).selectOption('2030');
  await startCalendar.getByLabel('Month', { exact: true }).selectOption('9');
  await startCalendar.getByRole('button', { name: '20/10/2030', exact: true }).click();
  await expect(start).toHaveValue('20/10/2030');
  await expect(startCalendar).toHaveCount(0);
  await page.getByRole('button', { name: 'Choose end date', exact: true }).click();
  const endCalendar = page.getByRole('group', { name: 'Calendar for end date', exact: true });
  await expect(endCalendar).toBeVisible();
  await expect(endCalendar.getByRole('button', { name: '19/10/2030', exact: true })).toBeDisabled();
  await endCalendar.getByRole('button', { name: '21/10/2030', exact: true }).click();
  await expect(end).toHaveValue('21/10/2030');
  await expect(endCalendar).toHaveCount(0);
});

test('partner uses the same registration form, keeps chosen date, equipment and terms', async ({ page }) => {
  await page.route('**/activity-schedule-test?partner', route => route.fulfill({
    contentType: 'text/html',
    body: '<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;</script><script type="module" src="/@vite/client"></script></head><body><div id="root"></div><script type="module" src="/tests/e2e/fixtures/activity-schedule.tsx"></script></body></html>',
  }));
  await page.goto('/activity-schedule-test?partner');
  await expect(page.getByRole('heading', { name: 'Register New Event' })).toBeVisible();
  await expect(page.locator('[data-event-registration-form]')).toHaveCount(1);
  await expect(page.getByRole('textbox', { name: 'Start date' })).toHaveValue('20/10/2030');
  await expect(page.getByRole('textbox', { name: 'End date' })).toHaveValue('20/10/2030');
  await expect(page.getByText('Test Publisher', { exact: true })).toBeVisible();
  await expect(page.locator('#act-published')).toHaveCount(0);
  await page.locator('input[required]').first().fill('Partner registered event');
  await page.locator('select[required]').selectOption('location');
  await page.getByLabel('Microphone').check();
  const submit = page.getByRole('button', { name: 'Register Event', exact: true });
  await submit.click();
  await expect(page.locator('output')).toHaveText('[]');
  await page.getByLabel('I agree to the event registration terms.').check();
  await submit.click();
  await expect(page.locator('output')).toContainText('Partner registered event');
  const [registration] = JSON.parse(await page.locator('output').textContent() || '[]');
  expect(registration).toMatchObject({ startAt: '2030-10-20T09:00:00+07:00', devices: [{ name: 'Microphone', quantity: 1 }] });
});

test('explicit dd/mm/yyyy dates support multi-day schedules and reject invalid or reversed ranges', async ({ page }) => {
  await page.route('**/activity-schedule-test', route => route.fulfill({
    contentType: 'text/html',
    body: '<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;</script><script type="module" src="/@vite/client"></script></head><body><div id="root"></div><script type="module" src="/tests/e2e/fixtures/activity-schedule.tsx"></script></body></html>',
  }));
  await page.goto('/activity-schedule-test');
  await page.locator('input[required]').first().fill('Multi-day activity');
  await page.locator('select[required]').selectOption('location');
  const start = page.getByRole('textbox', { name: 'Start date', exact: true });
  const end = page.getByRole('textbox', { name: 'End date', exact: true });
  const submit = page.getByRole('button', { name: 'Register Event', exact: true });
  await expect(start).toHaveAttribute('placeholder', 'dd/mm/yyyy');
  await start.fill('31/02/2030');
  await end.fill('01/03/2030');
  await submit.click();
  await expect(page.getByText('Enter valid start and end dates in dd/mm/yyyy format.')).toBeVisible();
  await expect(page.locator('output')).toHaveText('[]');
  await start.fill('20/10/2030');
  await end.fill('19/10/2030');
  await submit.click();
  await expect(page.getByText('End date and time must be after the start.')).toBeVisible();
  await end.fill('20/10/2030');
  await page.getByLabel('Start time', { exact: true }).fill('23:00');
  await page.getByLabel('End time', { exact: true }).fill('08:00');
  await submit.click();
  await expect(page.locator('output')).toHaveText('[]');
  await end.fill('21/10/2030');
  await submit.click();
  await expect(page.locator('output')).toContainText('2030-10-21T08:00:00+07:00');
  const created = JSON.parse(await page.locator('output').textContent() || '[]');
  expect(created[0]).toMatchObject({ startAt: '2030-10-20T23:00:00+07:00', endAt: '2030-10-21T08:00:00+07:00' });
});
