import { expect, Page } from '@playwright/test';

export type AuthRole = 'admin' | 'partner';

export async function signInRole(page: Page, role: AuthRole) {
  const prefix = role.toUpperCase();
  const email = process.env[`E2E_${prefix}_EMAIL`];
  const password = process.env[`E2E_${prefix}_PASSWORD`];
  if (!email || !password) {
    const response = await page.request.post('/api/auth/demo-login', { data: { role } });
    expect(response.ok(), 'Quick login phải được bật ở môi trường E2E local').toBe(true);
    const { data } = await response.json();
    await page.goto('/login');
    await page.evaluate(session => {
      sessionStorage.setItem('duongsach_token', session.accessToken);
      sessionStorage.setItem('duongsach_refresh_token', session.refreshToken);
      sessionStorage.setItem('duongsach_user', JSON.stringify(session.user));
    }, data);
    await page.goto(role === 'admin' ? '/admin' : '/partner');
    return;
  }
  await page.goto(role === 'admin' ? '/admin' : '/partner/login');
  await page.getByLabel(/Email/i).fill(email);
  await page.getByLabel(/^(Mật khẩu|Password)$/i).fill(password);
  await page.getByRole('button', { name: /Đăng nhập|Sign in/i }).click();
  await page.waitForURL(role === 'admin' ? /\/admin$/ : /\/partner$/);
}

export function trackRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().includes('favicon')) {
      errors.push(`${message.text()} (${message.location().url})`);
    }
  });
  return errors;
}

export async function expectHealthyPage(page: Page, runtimeErrors: string[]) {
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/Cannot read properties|Unexpected Application Error|404 Not Found/i);
  expect(runtimeErrors, `Lỗi JavaScript/console tại ${page.url()}`).toEqual([]);
}

export async function expectImagesLoaded(page: Page) {
  await page.locator('img[loading="lazy"]').evaluateAll(images => {
    images.forEach(image => { image.loading = 'eager'; });
  });
  await page.waitForFunction(() => Array.from(document.images).every(image => {
    image.loading = 'eager';
    return image.complete && image.naturalWidth > 0;
  }), undefined, { timeout: 20_000 });
  const brokenImages = await page.locator('img').evaluateAll(images => images
    .filter(image => image.complete && image.naturalWidth === 0)
    .map(image => ({ src: image.getAttribute('src'), alt: image.getAttribute('alt') })));
  expect(brokenImages, `Ảnh không tải được tại ${page.url()}`).toEqual([]);
}

export async function openRoleNavigation(page: Page, ariaLabel: string) {
  const sidebar = page.getByRole('complementary', { name: ariaLabel });
  const viewport = page.viewportSize();
  const isMobile = Boolean(viewport && viewport.width <= 1024);
  const mobileOpen = await sidebar.evaluate(element => element.classList.contains('is-mobile-open'));
  if (!isMobile || mobileOpen) return sidebar;

  const menuButton = page.getByRole('button', { name: /Mở menu|Toggle navigation/i }).first();
  await menuButton.click({ timeout: 5_000 });
  await expect(sidebar).toHaveClass(/is-mobile-open/);
  return sidebar;
}
