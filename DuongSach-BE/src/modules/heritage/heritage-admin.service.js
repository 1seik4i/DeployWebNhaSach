import { prisma } from '../../config/database.js';
import { config } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { getPagination } from '../../utils/pagination.js';

export const HeritageAdminService = {
  async list(query) {
    const paging = getPagination(query);
    const where = {
      isDeleted: false,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search ? { OR: ['name', 'nameEn', 'slug'].map(field => ({
        [field]: { contains: query.search, mode: 'insensitive' },
      })) } : {}),
    };
    const [data, total] = await prisma.$transaction([
      prisma.heritage.findMany({ where, skip: paging.skip, take: paging.limit, orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }] }),
      prisma.heritage.count({ where }),
    ]);
    return { data, meta: paging.meta(total) };
  },
  async get(id, db = prisma) {
    const heritage = await db.heritage.findFirst({ where: { id, isDeleted: false } });
    if (!heritage) throw ApiError.notFound('Không tìm thấy thông tin di sản');
    return heritage;
  },
  create(data) {
    return prisma.heritage.create({ data });
  },
  async update(id, input) {
    const heritage = await this.get(id);
    const { slug, ...data } = input;
    if (slug !== undefined && slug !== heritage.slug) {
      throw new ApiError(400, 'Slug di sản là định danh cố định không thể thay đổi', 'SLUG_IMMUTABLE');
    }
    return prisma.heritage.update({ where: { id, isDeleted: false }, data });
  },
  async remove(id, actorId) {
    await this.get(id);
    await prisma.heritage.update({ where: { id, isDeleted: false }, data: {
      isDeleted: true, deletedAt: new Date(), deletedBy: actorId,
    } });
    return { id, deleted: true };
  },
  async qr(id) {
    return prisma.$transaction(async tx => {
      // Serialize QR generation across processes without a schema migration.
      // The parent lock also prevents soft deletion during QR creation.
      await tx.$queryRaw`SELECT id FROM heritages WHERE id = ${id}::uuid FOR UPDATE`;
      const heritage = await this.get(id, tx);
      const existing = await tx.heritageQrCode.findFirst({
        where: { heritageId: id }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      });
      let base;
      try { base = new URL(config.publicWebUrl); } catch { throw ApiError.internal('PUBLIC_WEB_URL không hợp lệ'); }
      if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) {
        throw ApiError.internal('PUBLIC_WEB_URL không hợp lệ');
      }
      const publicUrl = `${base.href.replace(/\/+$/, '')}/heritage/${encodeURIComponent(heritage.slug)}`;
      // Reuse the record, normalizing legacy seed URLs to the configured destination.
      const qr = existing
        ? (existing.qrData === publicUrl ? existing : await tx.heritageQrCode.update({ where: { id: existing.id }, data: { qrData: publicUrl } }))
        : await tx.heritageQrCode.create({ data: { heritageId: id, qrData: publicUrl } });
      if (heritage.qrStatus !== 'active') await tx.heritage.update({ where: { id }, data: { qrStatus: 'active' } });
      return { ...qr, publicUrl };
    }, { maxWait: 10000, timeout: 10000 });
  },
};
