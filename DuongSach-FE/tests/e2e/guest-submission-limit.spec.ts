import { test, expect } from '@playwright/test';
const html = '<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;</script><script type="module" src="/@vite/client"></script></head><body><div id="root"></div><script type="module" src="/tests/e2e/fixtures/feedback-validation.tsx"></script></body></html>';
const quota = (used: number) => ({ limit: 3, used, remaining: 3 - used });
test('guest can send three per form, reload retains quota, fourth cannot submit', async ({ page }) => {
  let feedback = 0, eventProposal = 0;
  const sessions = new Set<string>();
  await page.route('**/feedback-validation-test', route => route.fulfill({ contentType: 'text/html', body: html }));
  await page.route('**/api/public/booths', route => route.fulfill({ json: { success: true, data: [] } }));
  await page.route('**/api/public/submission-quota', route => {
    sessions.add(route.request().headers()['x-guest-session']);
    return route.fulfill({ json: { success: true, data: { feedback: quota(feedback), eventProposal: quota(eventProposal) } } });
  });
  await page.route('**/api/public/feedbacks', route => {
    sessions.add(route.request().headers()['x-guest-session']); feedback++;
    return route.fulfill({ json: { success: true, data: { id: 'saved', submissionQuota: quota(feedback) } } });
  });
  await page.route('**/api/public/event-suggestions', route => {
    sessions.add(route.request().headers()['x-guest-session']); eventProposal++;
    return route.fulfill({ json: { success: true, data: { id: 'saved', submissionQuota: quota(eventProposal) } } });
  });
  await page.goto('/feedback-validation-test');
  for (let i = 0; i < 3; i++) {
    await expect(page.locator('.sk05-session-quota')).toContainText(`còn ${3 - i}/3`);
    await page.locator('#feedback-comment-input').fill(`Góp ý ${i + 1}`);
    await page.getByRole('button', { name: 'Gửi góp ý', exact: true }).click();
    await expect(page.getByText('Cảm ơn bạn đã đóng góp ý kiến!', { exact: true })).toBeVisible();
    if (i < 2) { await page.reload(); }
  }
  await expect(page.locator('.sk05-session-quota')).toContainText('tối đa 3 lần');
  await expect(page.getByRole('button', { name: 'Gửi thêm góp ý khác' })).toBeDisabled();
  await page.reload();
  await expect(page.locator('#feedback-comment-input')).toHaveCount(0);
  expect(feedback).toBe(3);
  await page.getByRole('button', { name: 'Đề xuất sự kiện', exact: true }).click();
  await expect(page.locator('.sk05-session-quota')).toContainText('còn 3/3');
  for (let i = 0; i < 3; i++) {
    await page.getByPlaceholder('Ví dụ: Tọa đàm Ra mắt sách Mùa Thu 2026').fill(`Sự kiện ${i + 1}`);
    await page.locator('textarea').fill('Nội dung đề xuất tổ chức sự kiện văn hóa');
    await page.getByPlaceholder('Nguyễn Văn A').fill('Nguyễn Văn An');
    await page.getByPlaceholder('0901 234 567').fill('0912345678');
    await page.getByPlaceholder('contact@domain.com').fill('test@example.com');
    await page.locator('.event-btn').click();
    await expect(page.getByText('Gửi đề xuất sự kiện thành công!', { exact: true })).toBeVisible();
    if (i < 2) await page.getByRole('button', { name: 'Gửi thêm đề xuất sự kiện khác' }).click();
  }
  await expect(page.getByRole('button', { name: 'Gửi thêm đề xuất sự kiện khác' })).toBeDisabled();
  await page.reload();
  await page.getByRole('button', { name: 'Đề xuất sự kiện', exact: true }).click();
  await expect(page.locator('.event-btn')).toHaveCount(0);
  expect(eventProposal).toBe(3);
  expect(sessions.size).toBe(1); expect([...sessions][0]).toMatch(/^[0-9a-f-]{36}$/);
});

test('server limit errors show a session limit, not a network error; failed requests do not consume local quota', async ({ page }) => {
  await page.route('**/feedback-validation-test', route => route.fulfill({ contentType: 'text/html', body: html }));
  await page.route('**/api/public/booths', route => route.fulfill({ json: { success: true, data: [] } }));
  await page.route('**/api/public/submission-quota', route => route.fulfill({ json: { success: true, data: { feedback: quota(0), eventProposal: quota(0) } } }));
  let status = 500;
  await page.route('**/api/public/feedbacks', route => route.fulfill({ status, json: { success: false, error: { code: status === 429 ? 'GUEST_SUBMISSION_LIMIT' : 'INTERNAL_ERROR', message: status === 429 ? 'Bạn đã gửi tối đa 3 lần cho biểu mẫu này trong phiên hiện tại.' : 'Temporary failure' } } }));
  await page.goto('/feedback-validation-test');
  await page.locator('#feedback-comment-input').fill('Góp ý thử nghiệm');
  await page.getByRole('button', { name: 'Gửi góp ý', exact: true }).click();
  await expect(page.locator('.sk05-result-desc')).toHaveText('Temporary failure');
  await expect(page.locator('.sk05-session-quota')).toContainText('còn 3/3');
  await page.getByRole('button', { name: 'Thử lại ngay' }).click();
  status = 429;
  await page.getByRole('button', { name: 'Gửi góp ý', exact: true }).click();
  await expect(page.locator('.sk05-result-desc')).toContainText('tối đa 3 lần');
  await expect(page.locator('.sk05-session-quota')).toContainText('tối đa 3 lần');
  await expect(page.getByRole('button', { name: 'Thử lại ngay' })).toBeDisabled();
  await expect(page.getByText(/Kết nối mạng tạm thời/)).toHaveCount(0);
});
