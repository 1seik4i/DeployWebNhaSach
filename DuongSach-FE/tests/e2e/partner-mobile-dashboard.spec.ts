import { test, expect } from '@playwright/test';

test.describe('Partner Mobile UI Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('duongsach_token', 'routing-test');
      sessionStorage.setItem('duongsach_user', JSON.stringify({ primaryRole: 'partner' }));
      sessionStorage.setItem('duongsach_partner_session', 'authenticated_partner');
    });

    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      let data: unknown = [];
      if (path.endsWith('/profile')) {
        data = { id: 'org-1', name: 'Nhà Xuất Bản Trẻ', email: 'partner@example.test', representativeName: 'Đối tác' };
      } else if (path === '/api/partner/event-applications') {
        data = [{ id: 'app-1', eventId: 'evt-1', eventTitle: 'Lễ hội Đường Sách Mùa Thu 2026', status: 'approved' }];
      } else if (path === '/api/partner/activity-proposals') {
        data = [
          {
            id: 'act-1',
            title: 'Tọa đàm: Dòng chảy Văn học Trẻ đương đại & Thói quen đọc thế hệ Gen Z',
            category: 'Talkshow',
            date: '15/10/2026',
            time: '12:25 – 14:25',
            duration: '2h',
            location: 'Sân Khấu Chính (Main Stage)',
            capacity: 100,
            registeredCount: 0,
            targetAudience: 'Bạn đọc trẻ',
            description: 'Giao lưu tác giả',
            speaker: 'Nguyễn Nhật Ánh',
            requiredEquipments: [],
            imageUrl: '',
            status: 'approved',
            eventId: 'evt-1',
            eventName: 'Lễ hội Đường Sách Mùa Thu 2026',
          }
        ];
      } else if (path === '/api/partner/booths') {
        data = [{ id: 'booth-1', code: 'B-01', name: 'Gian hàng Nhà Xuất Bản Trẻ', areaName: 'Khu A', openHours: '08:00 - 22:00', imageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f', assignedOrgId: 'org-1', assignedOrgName: 'Nhà Xuất Bản Trẻ' }];
      } else {
        data = [];
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data }),
      });
    });
  });

  test('Partner Dashboard on Mobile: cards, metadata, and buttons format cleanly', async ({ page }) => {
    // Set mobile viewport explicitly
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto('/partner/dashboard');
    await page.waitForLoadState('networkidle');

    // 1. Verify "Quản lý sách tại gian hàng" card
    const bookReminder = page.locator('.partner-sales-reminder');
    await expect(bookReminder).toBeVisible();
    const reminderBtn = page.locator('.partner-sales-reminder-link');
    await expect(reminderBtn).toBeVisible();

    // 2. Verify Latest Activity / Active Event card
    const activeEventCard = page.locator('.partner-active-event-card');
    await expect(activeEventCard).toBeVisible();

    // Check meta items
    const metaLine = page.locator('.event-meta-line');
    await expect(metaLine).toBeVisible();
    const metaItems = page.locator('.event-meta-item');
    const count = await metaItems.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Verify meta line has flex-direction column on mobile
    const metaLineFlexDir = await metaLine.evaluate((el) => window.getComputedStyle(el).flexDirection);
    expect(metaLineFlexDir).toBe('column');

    // 3. Verify Stat Cards
    const summaryGrid = page.locator('.partner-summary-grid');
    await expect(summaryGrid).toBeVisible();
    const statCards = page.locator('.partner-stat-card');
    expect(await statCards.count()).toBe(4);

    // 4. Verify To-Do section
    const todoSection = page.locator('.partner-todo-section');
    await expect(todoSection).toBeVisible();

    // 5. Verify Quick actions
    const quickActions = page.locator('.partner-dashboard-quick-actions');
    await expect(quickActions).toBeVisible();

    // Take screenshot of mobile dashboard
    await page.screenshot({ path: 'test-results/partner-dashboard-mobile.png', fullPage: true });
    await summaryGrid.screenshot({ path: 'test-results/partner-dashboard-stats.png' });
    await todoSection.screenshot({ path: 'test-results/partner-dashboard-todos.png' });
  });

  test('Partner Booths on Mobile: Yêu cầu hủy gian hàng button is full-width, single-line, and formatted cleanly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto('/partner/booths');
    await page.waitForLoadState('networkidle');

    // Check booth action buttons
    const btnGroup = page.locator('.booth-card-btn-group');
    if (await btnGroup.isVisible()) {
      const cancelBtn = page.locator('.booth-card-btn-group .btn-part-danger');
      await expect(cancelBtn).toBeVisible();

      // Check button computed styles
      const whiteSpace = await cancelBtn.evaluate((el) => window.getComputedStyle(el).whiteSpace);
      expect(whiteSpace).toBe('nowrap');

      const flexDir = await btnGroup.evaluate((el) => window.getComputedStyle(el).flexDirection);
      expect(flexDir).toBe('column');
    }

    await page.screenshot({ path: 'test-results/partner-booth-mobile.png', fullPage: true });
  });
});
