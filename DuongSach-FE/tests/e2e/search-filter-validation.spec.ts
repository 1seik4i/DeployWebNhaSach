import { expect, test } from '@playwright/test';
import { signInRole } from './helpers';
import { matchesSearch, isPublicationDate, isImageSource, isSupportPhone, validateManagedContent, vietnamDateKey } from '../../src/utils/inputValidation';
import { imageFileError, documentFileError } from '../../src/utils/fileValidation';
import { File as NodeFile } from 'node:buffer';

test('search handles blanks, Unicode and literal punctuation', () => {
  expect(matchesSearch('   ', null)).toBe(true);
  expect(matchesSearch('  Nguyễn  '.normalize('NFD'), 'NGUYỄN Văn An')).toBe(true);
  expect(matchesSearch('[x]', 'Book [x]')).toBe(true);
  expect(matchesSearch('.*', 'Book')).toBe(false);
  expect(isPublicationDate('29/02/2024')).toBe(true);
  expect(isPublicationDate('29/02/2026')).toBe(false);
  expect(isPublicationDate('31/04/2026')).toBe(false);
  expect(isSupportPhone('(028) 3822 1234')).toBe(true);
  expect(isSupportPhone('1900 1234')).toBe(true);
  expect(isSupportPhone('123')).toBe(false);
  expect(isImageSource('javascript:alert(1)')).toBe(false);
  expect(vietnamDateKey('2026-10-18T18:00:00Z')).toBe('2026-10-19');
  expect(() => validateManagedContent({ leaders: [{ contactEmail: 'bad' }] })).toThrow();
  expect(() => validateManagedContent({ achievements: [{ value: -1 }] })).toThrow();
  expect(() => validateManagedContent({ articles: [{ contentVi: ['![photo](data:image/png;base64,' + 'A'.repeat(30000) + ')'] }] })).not.toThrow();
  expect(imageFileError(new NodeFile(['<svg/>'], 'cover.svg', { type: 'image/svg+xml' }) as unknown as File)).toBeTruthy();
  expect(imageFileError(new NodeFile(['png'], 'cover.png', { type: 'image/png' }) as unknown as File)).toBeNull();
  expect(documentFileError(new NodeFile(['bad'], 'notes.exe', { type: 'application/octet-stream' }) as unknown as File)).toBeTruthy();
  expect(documentFileError(new NodeFile(['pdf'], 'notes.pdf', { type: 'application/pdf' }) as unknown as File, 2)).toBeNull();
});

test('admin top search opens accounts and blank search restores results', async ({ page }) => {
  await signInRole(page, 'admin');
  const mobile = (page.viewportSize()?.width || 1440) <= 768;
  if (mobile) await page.getByRole('button', { name: 'Danh sách người dùng' }).click();
  else {
    const topSearch = page.getByPlaceholder('Tìm tài khoản, phân quyền, cấu hình...');
    await expect(topSearch).toHaveAttribute('maxlength', '200');
    await topSearch.fill('   nonexistent-validation-user   ');
    await topSearch.press('Enter');
  }
  const userSearch = page.getByPlaceholder('Tìm theo tên, email, SĐT hoặc mã...');
  if (mobile) await userSearch.fill('   nonexistent-validation-user   ');
  else await expect(userSearch).toHaveValue('nonexistent-validation-user');
  await expect(page.locator(mobile ? '.adm-user-mobile-cards .adm-table-empty' : '.adm-user-desktop-table .adm-table-empty')).toBeVisible();
  await userSearch.fill('   ');
  await expect(mobile ? page.locator('.adm-user-mobile-card').first() : page.locator('.adm-user-desktop-table tbody tr').first()).toBeVisible();
});

test('partner top search applies and clears the query', async ({ page }) => {
  await signInRole(page, 'partner');
  const mobile = (page.viewportSize()?.width || 1440) <= 768;
  if (mobile) await page.goto('/partner/activities');
  const search = page.getByPlaceholder(mobile ? 'Tìm hoạt động...' : 'Tìm kiếm hoạt động...');
  await search.fill(mobile ? 'nonexistent-validation-activity' : '  nonexistent-validation-activity  ');
  if (!mobile) await search.press('Enter');
  await expect(page).toHaveURL(/search=nonexistent-validation-activity/);
  await expect(page.getByRole('status')).toContainText('nonexistent-validation-activity');
});
