import { expect, test } from '@playwright/test';

test.describe('Digital Library book modal browser history behavior', () => {
  test.beforeEach(async ({ page }) => {
    // Stable API fixtures isolate browser history from catalogue seed IDs.
    const titles = ['Dế mèn phiêu lưu ký', 'Cho tôi xin một vé đi tuổi thơ', 'Nhà giả kim', 'Đắc nhân tâm'];
    const books = titles.map((title, index) => ({ id: `book-0${index + 1}`, isbn: `history-${index}`, title, author: 'Tác giả kiểm thử', coverUrl: '/duong_sach_logo.png', description: 'Mô tả sách', categoryId: 'history-category', category: { id: 'history-category', name: 'Văn học' }, labels: [], labelIds: [], status: 'active', bestsellerRank: index + 1, weeklyRank: index + 1 }));
    await page.route('**/api/public/books**', route => {
      const path = new URL(route.request().url()).pathname;
      const id = path.split('/')[4];
      const data = path.endsWith('/stalls') ? [] : id ? books.find(book => book.id === id) : books;
      return route.fulfill({ json: { success: true, data } });
    });
    await page.route('**/api/public/book-categories', route => route.fulfill({ json: { success: true, data: [{ id: 'history-category', name: 'Văn học', status: 'active' }] } }));
    await page.route('**/api/public/book-stalls', route => route.fulfill({ json: { success: true, data: [] } }));
    await page.route('**/api/public/book-rankings', route => route.fulfill({ json: { success: true, data: { bestsellers: books, weeklyHot: books } } }));
  });
  test('Exact prompt test flow: open catalogue -> book-01 -> book-02 -> book-03 -> book-04 -> back once closes modal -> back again returns to previous page', async ({ page }) => {
    // 1. Visit homepage first so there is a previous history entry before /thu-vien-so
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();

    // 2. Open /thu-vien-so
    await page.goto('/thu-vien-so');
    await expect(page.locator('.library-catalogue')).toBeVisible();

    // 3. Click book-01
    const book01 = page.locator('button[data-book-id="book-01"]');
    await book01.waitFor({ state: 'visible' });
    await book01.click();
    await expect(page).toHaveURL(/\/thu-vien-so\?book=book-01/);
    await expect(page.locator('.book-detail-panel')).toBeVisible();

    // 4. Click book-02 while modal is open
    await page.evaluate(() => {
      (document.querySelector('button[data-book-id="book-02"]') as HTMLButtonElement | null)?.click();
    });
    await expect(page).toHaveURL(/\/thu-vien-so\?book=book-02/);
    await expect(page.locator('.book-detail-panel h2')).toHaveText(/Cho tôi xin một vé đi tuổi thơ/i);

    // 5. Click book-03
    await page.evaluate(() => {
      (document.querySelector('button[data-book-id="book-03"]') as HTMLButtonElement | null)?.click();
    });
    await expect(page).toHaveURL(/\/thu-vien-so\?book=book-03/);
    await expect(page.locator('.book-detail-panel h2')).toHaveText(/Nhà giả kim/i);

    // 6. Click book-04
    await page.evaluate(() => {
      (document.querySelector('button[data-book-id="book-04"]') as HTMLButtonElement | null)?.click();
    });
    await expect(page).toHaveURL(/\/thu-vien-so\?book=book-04/);
    await expect(page.locator('.book-detail-panel h2')).toHaveText(/Đắc nhân tâm/i);

    // 7. Press browser Back ONCE
    await page.goBack();

    // EXPECTED: Modal closes and URL becomes /thu-vien-so (NOT ?book=book-03)
    await expect(page).toHaveURL(/\/thu-vien-so$/);
    await expect(page.locator('.book-detail-panel')).toHaveCount(0);

    // 8. Press Back again
    await page.goBack();

    // EXPECTED: Return to the page visited before /thu-vien-so (homepage /)
    await expect(page).toHaveURL(/\/$/);
  });

  test('Homepage flow: click one ranked book in carousel -> modal opens -> Back once returns directly to homepage', async ({ page }) => {
    // 1. User on homepage /
    await page.goto('/');
    await page.locator('#thu-vien-so').scrollIntoViewIfNeeded();

    const carouselBook = page.locator('a.library-ranking-item[href*="book=book-03"]');
    await carouselBook.waitFor({ state: 'visible' });
    await carouselBook.click();

    // Modal opens directly at /thu-vien-so?book=book-03
    await expect(page).toHaveURL(/\/thu-vien-so\?book=book-03/);
    await expect(page.locator('.book-detail-panel')).toBeVisible();

    // Press Back once
    await page.goBack();

    // EXPECTED: Return directly to homepage
    await expect(page).toHaveURL(/\/$/);
  });

  test('Close button from catalogue: returns to /thu-vien-so without redundant history entries', async ({ page }) => {
    await page.goto('/');
    await page.goto('/thu-vien-so');

    const book01 = page.locator('button[data-book-id="book-01"]');
    await book01.waitFor({ state: 'visible' });
    await book01.click();
    await expect(page).toHaveURL(/\/thu-vien-so\?book=book-01/);

    await page.evaluate(() => {
      (document.querySelector('button[data-book-id="book-02"]') as HTMLButtonElement | null)?.click();
    });
    await expect(page).toHaveURL(/\/thu-vien-so\?book=book-02/);

    // Click modal close button
    await page.locator('.book-detail-close').click();
    await expect(page).toHaveURL(/\/thu-vien-so$/);
    await expect(page.locator('.book-detail-panel')).toHaveCount(0);

    // Back once should return directly to homepage, not get stuck on duplicate /thu-vien-so
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
  });

  test('Direct link: loading /thu-vien-so?book=book-03 directly works and close button safely returns to /thu-vien-so', async ({ page }) => {
    await page.goto('/thu-vien-so?book=book-03');
    await expect(page.locator('.book-detail-panel')).toBeVisible();
    await expect(page.locator('.book-detail-panel h2')).toHaveText(/Nhà giả kim/i);

    // Close button
    await page.locator('.book-detail-close').click();
    await expect(page).toHaveURL(/\/thu-vien-so$/);
    await expect(page.locator('.book-detail-panel')).toHaveCount(0);
  });

  test('Scroll preservation: switching books does not scroll page, closing modal restores exact catalogue position', async ({ page }) => {
    await page.goto('/thu-vien-so');
    await page.locator('.library-catalogue').scrollIntoViewIfNeeded();

    // Scroll down into the catalogue
    await page.evaluate(() => window.scrollTo(0, 450));
    await page.waitForTimeout(100);
    const scrollBefore = await page.evaluate(() => window.scrollY);
    expect(scrollBefore).toBeGreaterThan(0);

    // Click book-01
    const book01 = page.locator('button[data-book-id="book-01"]');
    await book01.waitFor({ state: 'visible' });
    await book01.click();
    await expect(page).toHaveURL(/\/thu-vien-so\?book=book-01/);

    // Switch books
    await page.evaluate(() => {
      (document.querySelector('button[data-book-id="book-02"]') as HTMLButtonElement | null)?.click();
    });
    await expect(page).toHaveURL(/\/thu-vien-so\?book=book-02/);

    // Close modal via Back
    await page.goBack();
    await expect(page).toHaveURL(/\/thu-vien-so$/);
    await expect(page.locator('.book-detail-panel')).toHaveCount(0);

    // Verify scroll position was restored
    const scrollAfter = await page.evaluate(() => window.scrollY);
    expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThan(5);
  });
});

