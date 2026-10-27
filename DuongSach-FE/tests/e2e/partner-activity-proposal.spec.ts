import { expect, test } from '@playwright/test';

test('partner activity page displays Thêm hoạt động button and opens modal', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('duongsach_token', 'routing-test');
    sessionStorage.setItem('duongsach_user', JSON.stringify({ primaryRole: 'partner' }));
    sessionStorage.setItem('duongsach_partner_session', 'authenticated_partner');
  });

  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = [];
    if (path.endsWith('/profile')) {
      data = { id: 'org-1', name: 'Nhà Xuất Bản Trẻ', email: 'partner@example.test', representativeName: 'Đối tác' };
    } else if (path === '/api/partner/event-applications') {
      data = [{ id: 'app-1', eventId: 'evt-1', eventTitle: 'Hội sách Mùa Thu', status: 'approved' }];
    } else if (path === '/api/partner/activity-proposals') {
      data = [
        {
          id: 'act-1',
          title: 'Tọa đàm: Dòng chảy Văn học Trẻ',
          category: 'Talkshow',
          date: '28/10/2026',
          time: '09:00 – 11:00',
          duration: '2h',
          location: 'Sân Khấu Chính',
          capacity: 100,
          registeredCount: 0,
          targetAudience: 'Bạn đọc trẻ',
          description: 'Giao lưu tác giả',
          speaker: 'Nguyễn Nhật Ánh',
          requiredEquipments: [],
          imageUrl: '',
          status: 'approved',
          eventId: 'evt-1',
          eventName: 'Hội sách Mùa Thu',
        }
      ];
    } else if (path === '/api/partner/event-locations') {
      data = [{ id: 'loc-1', name: 'Sân Khấu Chính', capacity: 100 }];
    } else if (path === '/api/partner/assets') {
      data = [{ id: 'ast-1', name: 'Microphone', totalQuantity: 4 }];
    }
    await route.fulfill({ json: { success: true, data } });
  });

  await page.goto('/partner/activities');

  const addBtn = page.getByRole('button', { name: 'Thêm hoạt động', exact: true });
  await expect(addBtn).toBeVisible();

  await addBtn.click();

  const modalHeading = page.getByRole('heading', { name: 'Đăng ký hoạt động mới' });
  await expect(modalHeading).toBeVisible();

  const submitBtn = page.getByRole('button', { name: 'Đăng ký hoạt động', exact: true });
  await expect(submitBtn).toBeVisible();
});
