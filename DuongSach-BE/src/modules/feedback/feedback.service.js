import { prisma } from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { getPagination } from '../../utils/pagination.js';

const include = { heritage: { select: { id: true, name: true, slug: true } } };
export const FeedbackService = {
  async list(query) {
    const paging = getPagination(query);
    const where = {};
    for (const field of ['heritageId', 'rating', 'status']) {
      if (query[field] !== undefined) where[field] = query[field];
    }
    const [data, total] = await prisma.$transaction([
      prisma.feedback.findMany({ where, include, skip: paging.skip, take: paging.limit, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] }),
      prisma.feedback.count({ where }),
    ]);
    return { data, meta: paging.meta(total) };
  },
  async get(id) {
    const feedback = await prisma.feedback.findUnique({ where: { id }, include });
    if (!feedback) throw ApiError.notFound('Không tìm thấy phản hồi');
    return feedback;
  },
  async updateStatus(id, data) {
    await this.get(id);
    return prisma.feedback.update({ where: { id }, data, include });
  },
};
