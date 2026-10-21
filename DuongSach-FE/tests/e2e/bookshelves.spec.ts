import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  const books = [
    { id: '00000000-0000-4000-8000-000000000001', title: 'Sách một', author: 'Tác giả một', isbn: '111', coverUrl: '/duong_sach_logo.png', status: 'active', categoryId: 'category-1' },
    { id: '00000000-0000-4000-8000-000000000002', title: 'Sách hai', author: 'Tác giả hai', isbn: '222', coverUrl: '/duong_sach_logo.png', status: 'active' },
  ];
  const shelves = [
    { id: 'ranked', name: 'Tủ có hạng', ranked: true, books: [...books] },
    { id: 'plain', name: 'Tủ không hạng', ranked: false, books: [books[1]] },
  ];
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    if (/\/bookshelves\/[^/]+$/.test(url.pathname)) {
      const index = shelves.findIndex(shelf => shelf.id === url.pathname.split('/').at(-1));
      if (index < 0) return route.fulfill({ status: 404 });
      if (route.request().method() === 'DELETE') shelves.splice(index, 1);
      else {
        const data = route.request().postDataJSON();
        shelves[index] = { ...shelves[index], ...data,
          books: data.bookIds ? data.bookIds.map((id: string) => books.find(book => book.id === id)) : shelves[index].books,
        };
      }
      return route.fulfill({ json: { success: true, data: { success: true } } });
    }
    if (url.pathname.endsWith('/bookshelves')) {
      if (route.request().method() === 'POST') {
        const data = route.request().postDataJSON();
        const row = { id: 'created', name: data.name, ranked: data.ranked, books: data.bookIds.map((id: string) => books.find(book => book.id === id)) };
        shelves.push(row);
        return route.fulfill({ json: { success: true, data: row } });
      }
      return route.fulfill({ json: { success: true, data: shelves } });
    }
    if (url.pathname.endsWith('/books')) return route.fulfill({ json: { success: true, data: books } });
    if (url.pathname.endsWith('/book-rankings')) return route.fulfill({ json: { success: true, data: { bestsellers: [], weeklyHot: [] } } });
    if (url.pathname.endsWith('/book-categories')) return route.fulfill({ json: { success: true, data: [{ id: 'category-1', name: 'Văn học', status: 'active' }] } });
    if (url.pathname.endsWith('/book-stalls')) return route.fulfill({ json: { success: true, data: [] } });
    return route.fulfill({ status: 404, json: { success: false } });
  });
  await page.route('**/bookshelves-test*', route => route.fulfill({ contentType: 'text/html', body: '<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;</script></head><body><div id="root"></div><script type="module" src="/tests/e2e/fixtures/bookshelves.tsx"></script></body></html>' }));
});

test('admin creates a ranked shelf and its book selection survives reload', async ({ page }) => {
  await page.goto('/bookshelves-test');
  await page.getByRole('button', { name: 'Tạo tủ sách', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Tên tủ sách', { exact: true }).fill('Sách mới tuyển chọn');
  await expect(dialog.getByLabel('Có xếp hạng', { exact: true })).not.toBeChecked();
  await dialog.getByLabel('Có xếp hạng', { exact: true }).check();
  await dialog.getByRole('checkbox', { name: /Sách một/ }).check();
  await dialog.getByRole('button', { name: 'Lưu tủ sách' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('tab', { name: /Sách mới tuyển chọn.*1/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('cell', { name: '#1', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('tab', { name: /Sách mới tuyển chọn.*1/ })).toBeVisible();
});

test('landing lists all shelves and displays ranks only when enabled', async ({ page }) => {
  await page.goto('/bookshelves-test?landing');
  await expect(page.getByRole('tab', { name: 'Tất cả sách' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.library-ranking-item')).toHaveCount(2);
  await expect(page.locator('.library-ranking-number')).toHaveCount(0);
  await page.getByRole('tab', { name: 'Tủ có hạng', exact: true }).click();
  await expect(page.locator('.library-ranking-number')).toHaveCount(2);
  await page.getByRole('tab', { name: 'Tủ không hạng', exact: true }).click();
  await expect(page.locator('.library-ranking-item')).toHaveCount(1);
  await expect(page.locator('.library-ranking-number')).toHaveCount(0);
});

test('full catalogue uses the configured shelves and removes the uncategorized filter', async ({ page }) => {
  await page.goto('/bookshelves-test?catalogue');
  await expect(page.getByRole('button', { name: 'Tủ có hạng', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Tủ không hạng', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tủ không hạng', exact: true })).toBeVisible();
  await expect(page.locator('.library-list-row')).toHaveCount(1);
  await page.getByRole('button', { name: 'Bộ lọc', exact: true }).click();
  await expect(page.locator('#library-category option[value="uncategorized"]')).toHaveCount(0);
});

test('categories appear on landing and full catalogue and filter their own books', async ({ page }) => {
  await page.goto('/bookshelves-test?landing');
  await page.getByRole('tab', { name: 'Văn học', exact: true }).click();
  await expect(page.locator('.library-ranking-item')).toHaveCount(1);
  await expect(page.locator('.library-ranking-number')).toHaveCount(0);
  await page.goto('/bookshelves-test?catalogue');
  await page.getByRole('button', { name: 'Văn học', exact: true }).click();
  await expect(page.locator('.library-list-row')).toHaveCount(1);
  await expect(page.locator('.library-list-row')).toContainText('Sách một');
});

test('admin drags the rank handle and the order persists after reload', async ({ page }) => {
  await page.goto('/bookshelves-test');
  const handle = page.getByRole('button', { name: 'Kéo để đổi hạng Sách một', exact: true });
  const target = page.getByRole('button', { name: 'Kéo để đổi hạng Sách hai', exact: true });
  await expect(handle).toBeVisible();
  await target.scrollIntoViewIfNeeded();
  await handle.scrollIntoViewIfNeeded();
  const start = (await handle.boundingBox())!;
  const end = (await target.boundingBox())!;
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2 + 15, { steps: 20 });
  await page.mouse.up();
  await expect(page.locator('tbody tr').first()).toContainText('Sách hai');
  await page.reload();
  await expect(page.locator('tbody tr').first()).toContainText('Sách hai');
});

test('unranked shelves have no rank columns or handles, and can be edited and deleted', async ({ page }) => {
  await page.goto('/bookshelves-test');
  await page.getByRole('tab', { name: /Tủ không hạng.*1/ }).click();
  await expect(page.getByRole('columnheader', { name: 'Hạng', exact: true })).toHaveCount(0);
  await expect(page.getByRole('columnheader', { name: 'Thứ hạng', exact: true })).toHaveCount(0);
  await expect(page.locator('.bookshelf-drag-handle')).toHaveCount(0);
  await page.getByRole('button', { name: 'Sửa tủ sách / Chọn sách' }).click();
  await page.getByRole('dialog').getByLabel('Tên tủ sách', { exact: true }).fill('Tủ đã đổi tên');
  await page.getByRole('dialog').getByRole('button', { name: 'Lưu tủ sách' }).click();
  await expect(page.getByRole('tab', { name: /Tủ đã đổi tên.*1/ })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: 'Xóa tủ sách', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('tab', { name: /Tủ đã đổi tên.*1/ })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('tab', { name: /Tủ đã đổi tên.*1/ })).toHaveCount(0);
});

test('removing a book from a shelf preserves it in the library', async ({ page }) => {
  await page.goto('/bookshelves-test');
  await page.getByRole('button', { name: 'Gỡ khỏi tủ Sách một', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.goto('/bookshelves-test?landing');
  await expect(page.locator('.library-ranking-item')).toHaveCount(2);
});
