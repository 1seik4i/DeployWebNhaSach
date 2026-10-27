import { expect, test } from '@playwright/test';

test('partner activity page displays Thêm hoạt động button, targetAudience input, and submits proposal', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('duongsach_token', 'routing-test');
    sessionStorage.setItem('duongsach_user', JSON.stringify({ primaryRole: 'partner' }));
    sessionStorage.setItem('duongsach_partner_session', 'authenticated_partner');
  });

  let submittedProposal: any = null;

  await page.route('**/api/**', async route => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    const method = req.method();

    if (path.endsWith('/profile')) {
      await route.fulfill({ json: { success: true, data: { id: 'org-1', name: 'Nhà Xuất Bản Trẻ', email: 'partner@example.test', representativeName: 'Đối tác' } } });
      return;
    }
    if (path === '/api/partner/event-applications') {
      await route.fulfill({
        json: {
          success: true,
          data: [{
            id: 'app-1',
            eventId: 'evt-1',
            eventTitle: 'Hội sách Mùa Thu',
            status: 'approved',
            event: {
              startAt: '2026-11-01T00:00:00.000Z',
              endAt: '2026-11-30T23:59:59.000Z',
            },
          }],
        },
      });
      return;
    }
    if (path === '/api/partner/activity-proposals' && method === 'GET') {
      await route.fulfill({
        json: {
          success: true,
          data: [
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
          ]
        }
      });
      return;
    }
    if ((path === '/api/partner/activity-proposals' || path === '/api/partner/event-registrations') && method === 'POST') {
      submittedProposal = req.postDataJSON();
      await route.fulfill({
        json: {
          success: true,
          data: {
            id: 'act-2',
            ...submittedProposal,
            status: 'pending'
          }
        }
      });
      return;
    }
    if (path === '/api/partner/event-locations') {
      await route.fulfill({ json: { success: true, data: [{ id: 'loc-1', name: 'Sân Khấu Chính', capacity: 100 }] } });
      return;
    }
    if (path === '/api/partner/assets') {
      await route.fulfill({ json: { success: true, data: [{ id: 'ast-1', name: 'Microphone', totalQuantity: 4 }] } });
      return;
    }
    if (path === '/api/partner/reports') {
      await route.fulfill({ json: { success: true, data: [] } });
      return;
    }
    await route.fulfill({ json: { success: true, data: [] } });
  });

  await page.goto('/partner/activities');

  const addBtn = page.getByRole('button', { name: 'Thêm hoạt động', exact: true });
  await expect(addBtn).toBeVisible();

  await addBtn.click();

  const modalHeading = page.getByRole('heading', { name: 'Đăng ký hoạt động mới' });
  await expect(modalHeading).toBeVisible();

  // Verify targetAudience input is rendered with prefilled default value
  const audienceInput = page.getByPlaceholder('Ví dụ: Độc giả trẻ, học sinh, sinh viên, đại chúng...');
  await expect(audienceInput).toBeVisible();
  await expect(audienceInput).toHaveValue('Mọi lứa tuổi, độc giả yêu sách');

  // Fill event title
  await page.getByPlaceholder('Ví dụ: Giao lưu tác giả & Ký tặng sách mới').fill('Giao lưu tác giả tác phẩm mới');

  // Fill speaker
  await page.getByPlaceholder('Ví dụ: Nhà văn Nguyễn Nhật Ánh').fill('Nhà văn Nguyễn Nhật Ánh');

  // Change audience to test custom input
  await audienceInput.fill('Học sinh, sinh viên và bạn đọc trẻ');

  // Fill dates
  await page.getByRole('textbox', { name: 'Ngày bắt đầu' }).fill('28/11/2026');
  await page.getByRole('textbox', { name: 'Ngày kết thúc' }).fill('29/11/2026');

  // Select location
  await page.locator('select').filter({ hasText: 'Chọn địa điểm tổ chức' }).selectOption('loc-1');

  // Check agreement checkbox
  const agreement = page.getByRole('checkbox', { name: /Tôi cam kết tuân thủ quy chế/ });
  await agreement.check();

  const submitBtn = page.getByRole('button', { name: 'Đăng ký hoạt động', exact: true });
  await expect(submitBtn).toBeVisible();
  await submitBtn.click();

  // Verify modal closes
  await expect(modalHeading).not.toBeVisible();

  // Verify submitted payload contains valid targetAudience
  expect(submittedProposal).not.toBeNull();
  expect(submittedProposal.title).toBe('Giao lưu tác giả tác phẩm mới');
  expect(submittedProposal.targetAudience).toBe('Học sinh, sinh viên và bạn đọc trẻ');
});

test('partner activity detail page has no redundant top edit button and can edit general info', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('duongsach_token', 'routing-test');
    sessionStorage.setItem('duongsach_user', JSON.stringify({ primaryRole: 'partner' }));
    sessionStorage.setItem('duongsach_partner_session', 'authenticated_partner');
  });

  let patchedData: any = null;

  await page.route('**/api/**', async route => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    const method = req.method();

    if (path.endsWith('/profile')) {
      await route.fulfill({ json: { success: true, data: { id: 'org-1', name: 'Nhà Xuất Bản Trẻ', email: 'partner@example.test', representativeName: 'Đối tác' } } });
      return;
    }
    if (path === '/api/partner/event-applications') {
      await route.fulfill({ json: { success: true, data: [{ id: 'app-1', eventId: 'evt-1', eventTitle: 'Hội sách Mùa Thu', status: 'approved' }] } });
      return;
    }
    if (path === '/api/partner/activity-proposals' && method === 'GET') {
      await route.fulfill({
        json: {
          success: true,
          data: [
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
              description: 'Giao lưu tác giả tác phẩm',
              speaker: 'Nguyễn Nhật Ánh',
              requiredEquipments: [],
              imageUrl: '',
              status: 'approved',
              eventId: 'evt-1',
              eventName: 'Hội sách Mùa Thu',
            }
          ]
        }
      });
      return;
    }
    if (path === '/api/partner/activity-proposals/act-1' && method === 'PATCH') {
      patchedData = req.postDataJSON();
      await route.fulfill({
        json: {
          success: true,
          data: {
            id: 'act-1',
            title: patchedData.title || 'Tọa đàm: Dòng chảy Văn học Trẻ',
            category: 'Talkshow',
            date: '28/10/2026',
            time: '09:00 – 11:00',
            duration: '2h',
            location: 'Sân Khấu Chính',
            capacity: patchedData.capacity || 100,
            registeredCount: 0,
            targetAudience: 'Bạn đọc trẻ',
            description: patchedData.description || 'Giao lưu tác giả tác phẩm',
            speaker: patchedData.speaker || 'Nguyễn Nhật Ánh',
            requiredEquipments: [],
            imageUrl: '',
            status: 'approved',
            eventId: 'evt-1',
            eventName: 'Hội sách Mùa Thu',
          }
        }
      });
      return;
    }
    if (path.includes('/participants')) {
      await route.fulfill({ json: { success: true, data: [] } });
      return;
    }
    await route.fulfill({ json: { success: true, data: [] } });
  });

  await page.goto('/partner/activities/act-1');

  // Verify header has title and status badge
  await expect(page.getByRole('heading', { name: 'Tọa đàm: Dòng chảy Văn học Trẻ' })).toBeVisible();

  // Verify there is NO top "Chỉnh sửa" button in the card header next to the title
  const topHeader = page.locator('.partner-card-pad').first();
  await expect(topHeader.getByRole('button', { name: 'Chỉnh sửa', exact: true })).toHaveCount(0);

  // In the bottom section of tab Thông tin chung, there is "Chỉnh sửa thông tin"
  const bottomEditBtn = page.getByRole('button', { name: 'Chỉnh sửa thông tin', exact: true });
  await expect(bottomEditBtn).toBeVisible();

  // Also verify "Yêu cầu thay đổi" and "Yêu cầu hủy hoạt động" are present
  await expect(page.getByRole('button', { name: 'Yêu cầu thay đổi', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Yêu cầu hủy hoạt động', exact: true })).toBeVisible();

  // Click bottom edit button to open edit form
  await bottomEditBtn.click();

  // Edit form heading should be visible
  await expect(page.getByText('Chỉnh sửa thông tin hoạt động')).toBeVisible();

  // Modify speaker
  const speakerInput = page.locator('input[value="Nguyễn Nhật Ánh"]');
  await speakerInput.fill('Nhà văn Nguyễn Nhật Ánh (Khách mời đặc biệt)');

  // Submit edit form
  const saveBtn = page.getByRole('button', { name: 'Lưu thay đổi', exact: true });
  await saveBtn.click();

  // Verify patched data
  expect(patchedData).not.toBeNull();
  expect(patchedData.speaker).toBe('Nhà văn Nguyễn Nhật Ánh (Khách mời đặc biệt)');
});

