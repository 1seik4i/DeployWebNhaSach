import { prisma } from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';

export class HeritageService {
  // Public landing page can look up a published heritage by its stable slug or UUID.
  static async getHeritageBySlug(slugOrId) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    const heritage = await prisma.heritage.findFirst({
      where: {
        isDeleted: false,
        status: 'published',
        OR: isUuid ? [{ slug: slugOrId }, { id: slugOrId }] : [{ slug: slugOrId }],
      },
      include: {
        qrCodes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!heritage || heritage.isDeleted) {
      throw ApiError.notFound('Không tìm thấy thông tin di sản');
    }

    return heritage;
  }

}

