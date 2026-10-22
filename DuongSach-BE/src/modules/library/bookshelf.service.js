import crypto from 'node:crypto';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { audit, parse, text, transaction, uuid } from '../../utils/contract.js';
import { ApiError } from '../../utils/ApiError.js';
import { LibraryService } from './library.service.js';

const key = 'library.bookshelves';
const defaults = () => [
  { id: 'bestseller', name: 'Top 100 bán chạy', ranked: true, source: 'bestseller' },
  { id: 'weekly_hot', name: 'Hot tuần này', ranked: true, source: 'weekly_hot' },
];
const input = z.object({
  name: text,
  ranked: z.boolean(),
  bookIds: z.array(uuid).max(5000).refine(ids => new Set(ids).size === ids.length, 'Danh sách sách bị trùng'),
}).strict();

async function configuration(db) {
  const setting = await db.setting.findUnique({ where: { key } });
  return setting ? setting.value : defaults();
}

export const BookshelfService = {
  async remove(id, user) {
    return transaction(async tx => {
      const shelves = await configuration(tx);
      const shelf = shelves.find(row => row.id === id);
      if (!shelf) throw ApiError.notFound('Không tìm thấy tủ sách');
      if (shelf.id === 'bestseller' || shelf.source === 'bestseller') {
        throw ApiError.badRequest('Tủ sách Top 100 bán chạy là mặc định của hệ thống, không được xóa');
      }
      const next = shelves.filter(row => row.id !== id);
      await tx.setting.upsert({ where: { key }, create: { key, value: next }, update: { value: next } });
      await audit(tx, user, 'delete', 'Bookshelf', uuid.safeParse(id).success ? id : null, { shelfId: id, name: shelf.name });
      return { success: true };
    });
  },
  async list(admin = false) {
    const shelves = await configuration(prisma);
    const books = (await LibraryService.books({}, admin)).filter(book => book.status === 'active');
    const byId = new Map(books.map(book => [book.id, book]));
    const rankings = shelves.some(shelf => shelf.source) ? await LibraryService.rankings(admin) : null;
    return shelves.map(shelf => ({
      id: shelf.id, name: shelf.name, ranked: shelf.ranked,
      books: shelf.source
        ? (shelf.source === 'bestseller' ? rankings.bestsellers : rankings.weeklyHot)
        : shelf.bookIds.map(id => byId.get(id)).filter(Boolean),
    }));
  },
  async save(id, body, user) {
    const data = parse(id ? input.partial() : input, body);
    return transaction(async tx => {
      const shelves = await configuration(tx);
      const existing = id ? shelves.find(shelf => shelf.id === id) : null;
      if (id && !existing) throw ApiError.notFound('Không tìm thấy tủ sách');
      const name = data.name || existing?.name;
      if (shelves.some(shelf => shelf.id !== id && shelf.name.normalize('NFC').toLocaleLowerCase('vi') === name.normalize('NFC').toLocaleLowerCase('vi'))) {
        throw ApiError.conflict('Tên tủ sách đã tồn tại');
      }
      if (data.bookIds?.length) {
        const count = await tx.book.count({ where: { id: { in: data.bookIds }, status: 'active' } });
        if (count !== data.bookIds.length) throw ApiError.validation([{ field: 'bookIds', message: 'Chỉ chọn sách đang hoạt động' }]);
      }
      const shelf = { ...(existing || { id: crypto.randomUUID() }), ...data };
      if (data.bookIds !== undefined) delete shelf.source;
      const next = existing ? shelves.map(row => row.id === id ? shelf : row) : [...shelves, shelf];
      await tx.setting.upsert({ where: { key }, create: { key, value: next }, update: { value: next } });
      await audit(tx, user, existing ? 'update' : 'create', 'Bookshelf', uuid.safeParse(shelf.id).success ? shelf.id : null, { shelfId: shelf.id, name: shelf.name, ranked: shelf.ranked });
      return { id: shelf.id, name: shelf.name, ranked: shelf.ranked };
    });
  },
};
