import { expect, test } from '@playwright/test';

for (const status of ['happening', 'upcoming', 'completed'] as const) {
  test(`partner participation follows ${status} status without a deadline`, async ({ page }) => {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const date = new Date(`${today}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + (status === 'upcoming' ? 1 : status === 'completed' ? -1 : 0));
    const day = date.toISOString().slice(0, 10);
    const eventId = '00000000-0000-4000-8000-000000000001';
    const title = `Participation ${status}`;
    let submissions = 0;
    await page.addInitScript(() => {
      sessionStorage.setItem('duongsach_token', 'routing-test');
      sessionStorage.setItem('duongsach_user', JSON.stringify({ primaryRole: 'partner' }));
    });
    await page.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname;
      let data: unknown = [];
      if (path.endsWith('/profile')) data = { id: 'organization', name: 'Publisher', email: 'partner@example.test', representativeName: 'Partner' };
      if (path === '/api/partner/schedule') data = [{ id: `event:${eventId}`, title, status, startDate: day, endDate: day, startAt: `${day}T09:00:00+07:00`, endAt: `${day}T17:00:00+07:00`, dateRange: day, timeStr: '09:00 – 17:00', location: 'Stage', description: 'Open participation', categoryTag: 'Talkshow', badgeColor: '#047857', boothOccupancy: '0', isPublished: true, settings: { partnerApplyDeadline: '2000-01-01' } }];
      if (path === '/api/partner/event-applications' && route.request().method() === 'POST') {
        submissions++;
        expect(route.request().postDataJSON()).toEqual({ eventId });
        data = { id: 'application', status: 'submitted' };
      }
      await route.fulfill({ json: { success: true, data } });
    });
    await page.goto('/partner/events');
    if ((page.viewportSize()?.width ?? 1280) <= 768) {
      await page.locator('.cal-day-cell-partner').filter({ has: page.getByText(title, { exact: true }) }).first().click();
    }
    await page.locator(`:text-is("${title}"):visible`).first().click();
    const apply = page.getByRole('button', { name: 'Đăng ký tham gia sự kiện này', exact: true });
    await expect(apply).toBeVisible();
    if (status === 'completed') {
      await expect(apply).toBeDisabled();
      expect(submissions).toBe(0);
    } else {
      await expect(apply).toBeEnabled();
      await apply.click();
      await expect.poll(() => submissions).toBe(1);
    }
  });
}
