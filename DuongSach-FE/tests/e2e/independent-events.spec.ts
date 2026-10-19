import { expect, test } from '@playwright/test';

for (const role of ['admin', 'partner'] as const) {
  test(`${role} sends independent registration without eventId or previous approved application`, async ({ page }) => {
    const eventId = '00000000-0000-4000-8000-000000000001';
    const locationId = '00000000-0000-4000-8000-000000000002';
    const writes: Array<Record<string, unknown>> = [];
    await page.addInitScript(role => {
      sessionStorage.setItem('duongsach_token', 'routing-test');
      sessionStorage.setItem('duongsach_user', JSON.stringify({ primaryRole: role }));
    }, role);
    await page.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname;
      let data: unknown = [];
      if (path.endsWith('/profile')) data = { id: 'actor', name: 'Publisher', fullName: 'Account', email: 'person@example.test', representativeName: 'Representative', phone: '0912345678' };
      if (path === '/api/admin/settings') data = [{ key: 'admin.system', value: {} }];
      if (path === '/api/admin/dashboard') data = { userCount: 0, eventCount: 1, openEventCount: 1, boothCount: 0, activityCount: 0, todayActivityCount: 0, usersByRole: {}, auditByDay: [] };
      // An existing event has a completely unrelated date range.
      if (path === '/api/admin/events') data = [{ id: eventId, title: 'Unrelated old event', startAt: '2035-01-01T08:00:00+07:00', endAt: '2035-01-01T09:00:00+07:00', status: 'published' }];
      if (path.endsWith('/event-locations')) data = [{ id: locationId, name: 'Independent location', capacity: 30 }];
      // Partner event-applications remains []: there is no prior approved application.
      if (path === `/api/${role}/event-registrations` && route.request().method() === 'POST') {
        writes.push(route.request().postDataJSON());
        data = { id: 'new-independent-event', status: role === 'partner' ? 'pending' : 'published' };
      }
      await route.fulfill({ json: { success: true, data } });
    });
    await page.goto(`/${role}/events`);
    await page.getByRole('button', { name: 'Đăng ký sự kiện mới', exact: true }).first().click();
    const form = page.locator('[data-event-registration-form]');
    await expect(form).toBeVisible();
    await form.locator('input[required]').first().fill(`Independent ${role} event`);
    await page.getByRole('textbox', { name: 'Ngày bắt đầu', exact: true }).fill('21/10/2010');
    await page.getByRole('textbox', { name: 'Ngày kết thúc', exact: true }).fill('22/10/2010');
    await form.locator('select[required]').selectOption(locationId);
    if (role === 'partner') await form.locator('input[type=checkbox][required]').check();
    await page.getByRole('button', { name: 'Đăng ký sự kiện', exact: true }).click();
    await expect.poll(() => writes.length).toBe(1);
    expect(writes[0]).not.toHaveProperty('eventId');
    expect(writes[0]).toMatchObject({ title: `Independent ${role} event`, locationId, startAt: '2010-10-21T09:00:00+07:00', endAt: '2010-10-22T11:00:00+07:00' });
    await expect(form).toHaveCount(0);
  });
}
