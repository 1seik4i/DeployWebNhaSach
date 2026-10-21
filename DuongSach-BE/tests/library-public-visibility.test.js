import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('../src/config/database.js', () => ({ prisma: { book: { findMany: vi.fn(), findFirst: vi.fn() }, bookStall: { findMany: vi.fn() } } }));
import { prisma } from '../src/config/database.js';
import { LibraryService } from '../src/modules/library/library.service.js';
const classified = { status: 'active', category: { is: { status: 'active', name: { not: 'Chưa phân loại' } } } };
beforeEach(() => { vi.clearAllMocks(); prisma.book.findMany.mockResolvedValue([]); prisma.book.findFirst.mockResolvedValue(null); prisma.bookStall.findMany.mockResolvedValue([]); });
it('requires an active category for every public catalogue and search query', async () => {
  await LibraryService.books({ search: 'Sách' });
  expect(prisma.book.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining(classified) }));
});
it('keeps uncategorized books available for admin classification', async () => {
  await LibraryService.books({}, true);
  expect(prisma.book.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
});
it('applies the same public eligibility to direct book links', async () => {
  const id = '00000000-0000-4000-8000-000000000001';
  await expect(LibraryService.book(id)).rejects.toMatchObject({ statusCode: 404 });
  expect(prisma.book.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id, ...classified } }));
});
it('does not expose stock entries for unclassified books publicly', async () => {
  await LibraryService.stalls();
  expect(prisma.bookStall.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { stall: { isDeleted: false }, book: classified } }));
});
