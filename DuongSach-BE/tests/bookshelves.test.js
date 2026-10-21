import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../src/config/database.js', () => {
  const prisma = { setting: { findUnique: vi.fn(), upsert: vi.fn() }, book: { count: vi.fn() }, auditLog: { create: vi.fn() } };
  prisma.$transaction = vi.fn(work => work(prisma));
  return { prisma };
});
vi.mock('../src/middlewares/auth.js', () => ({ authenticate: (req, res, next) => { req.user = { id: 'actor', primaryRole: req.headers['x-role'] || 'admin' }; next(); } }));
vi.mock('../src/middlewares/rbac.js', () => ({ authorize: (...roles) => (req, res, next) => roles.includes(req.user.primaryRole) ? next() : res.sendStatus(403), requirePermission: () => (req, res, next) => next() }));
import { prisma } from '../src/config/database.js';
import { LibraryService } from '../src/modules/library/library.service.js';
import { createApp } from '../src/app.js';
const app = createApp();
const first = { id: '00000000-0000-4000-8000-000000000001', title: 'First', status: 'active' };
const second = { id: '00000000-0000-4000-8000-000000000002', title: 'Second', status: 'active' };
let stored;
beforeEach(() => {
  vi.restoreAllMocks(); vi.clearAllMocks(); stored = null;
  prisma.setting.findUnique.mockImplementation(async () => stored ? { value: stored } : null);
  prisma.setting.upsert.mockImplementation(async ({ create, update }) => { stored = stored ? update.value : create.value; return { value: stored }; });
  prisma.book.count.mockImplementation(async ({ where }) => where.id.in.filter(id => [first.id, second.id].includes(id)).length);
  vi.spyOn(LibraryService, 'books').mockResolvedValue([first, second]);
  vi.spyOn(LibraryService, 'rankings').mockResolvedValue({ bestsellers: [second, first], weeklyHot: [] });
});

describe('bookshelves API', () => {
  it('deletes only the bookshelf and preserves an empty configuration after deleting the last shelf', async () => {
    stored = [{ id: 'custom', name: 'Only shelf', ranked: true, bookIds: [first.id] }];
    expect((await request(app).delete('/api/admin/bookshelves/custom')).status).toBe(200);
    expect(stored).toEqual([]);
    expect((await request(app).get('/api/public/bookshelves')).body.data).toEqual([]);
    expect(prisma.book.count).not.toHaveBeenCalled();
    expect((await request(app).delete('/api/admin/bookshelves/custom')).status).toBe(404);
  });
  it('deletes a built-in bookshelf without recreating it on the next read', async () => {
    expect((await request(app).delete('/api/admin/bookshelves/bestseller')).status).toBe(200);
    expect((await request(app).get('/api/public/bookshelves')).body.data.map(row => row.id)).toEqual(['weekly_hot']);
  });
  it('does not allow partners to delete a shelf', async () => {
    expect((await request(app).delete('/api/admin/bookshelves/bestseller').set('x-role', 'partner')).status).toBe(403);
    expect(prisma.setting.upsert).not.toHaveBeenCalled();
  });
  it('preserves both existing ranking shelves before any configuration is saved', async () => {
    const result = await request(app).get('/api/public/bookshelves');
    expect(result.status).toBe(200);
    expect(result.body.data).toEqual([
      { id: 'bestseller', name: 'Top 100 bán chạy', ranked: true, books: [second, first] },
      { id: 'weekly_hot', name: 'Hot tuần này', ranked: true, books: [] },
    ]);
  });
  it.each([true, false])('persists a new bookshelf with ranked=%s, its selected books and their order', async ranked => {
    const response = await request(app).post('/api/admin/bookshelves').send({ name: 'Sách hay', ranked, bookIds: [second.id, first.id] });
    expect(response.status).toBe(200);
    const reloaded = await request(app).get('/api/public/bookshelves');
    expect(reloaded.body.data.at(-1)).toMatchObject({ name: 'Sách hay', ranked, books: [second, first] });
  });
  it('updates rank order and can disable ranking without removing the books', async () => {
    await request(app).patch('/api/admin/bookshelves/bestseller').send({ bookIds: [first.id, second.id], ranked: false });
    const result = await request(app).get('/api/public/bookshelves');
    expect(result.body.data[0]).toMatchObject({ ranked: false, books: [first, second] });
  });
  it('does not expose a book that was archived after it was selected', async () => {
    stored = [{ id: 'custom', name: 'Sách hay', ranked: false, bookIds: [first.id, second.id] }];
    LibraryService.books.mockResolvedValue([second]);
    const result = await request(app).get('/api/public/bookshelves');
    expect(result.body.data[0].books).toEqual([second]);
  });
  it.each([
    { name: '', ranked: false, bookIds: [] },
    { name: 'Shelf', ranked: 'yes', bookIds: [] },
    { name: 'Shelf', ranked: false, bookIds: [first.id, first.id] },
    { name: 'Shelf', ranked: false, bookIds: ['00000000-0000-4000-8000-000000000099'] },
  ])('rejects invalid input without persisting it', async body => {
    expect((await request(app).post('/api/admin/bookshelves').send(body)).status).toBe(422);
    expect(prisma.setting.upsert).not.toHaveBeenCalled();
  });
  it('rejects duplicate names and unknown shelf IDs', async () => {
    expect((await request(app).post('/api/admin/bookshelves').send({ name: 'top 100 bán chạy', ranked: false, bookIds: [] })).status).toBe(409);
    expect((await request(app).patch('/api/admin/bookshelves/missing').send({ ranked: false })).status).toBe(404);
  });
  it('rejects partner mutations', async () => {
    expect((await request(app).post('/api/admin/bookshelves').set('x-role', 'partner').send({ name: 'Shelf', ranked: false, bookIds: [] })).status).toBe(403);
    expect(prisma.setting.upsert).not.toHaveBeenCalled();
  });
});
