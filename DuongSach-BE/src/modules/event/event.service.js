import { prisma } from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { getPagination } from '../../utils/pagination.js';
import { EventMapper } from './event.mapper.js';
import { formatDateVietnam } from '../../utils/dateFormat.js';
import { translateViToEn } from '../../services/translate.service.js';

export const slugify = (text) => {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export class EventService {
  static async generateUniqueSlug(title) {
    const base = slugify(title) || 'event';
    const existingEvents = await prisma.event.findMany({
      where: {
        slug: {
          startsWith: base,
        },
      },
      select: { slug: true },
    });

    const set = new Set(existingEvents.map(e => e.slug));
    if (!set.has(base)) {
      return base;
    }

    let counter = 2;
    while (set.has(`${base}-${counter}`)) {
      counter++;
    }
    return `${base}-${counter}`;
  }

  static async list(query = {}) {
    const { page, limit, skip, meta } = getPagination(query);
    const search = typeof query.search === 'string' ? query.search.trim() : '';

    const where = {
      isDeleted: false,
    };

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (query.priorityLevel) {
      where.priorityLevel = query.priorityLevel;
    }

    if (query.status) {
      where.status = query.status;
    }

    const [total, events] = await Promise.all([
      prisma.event.count({ where }),
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ startAt: 'asc' }, { createdAt: 'desc' }],
        include: {
          venue: true,
          settings: true,
          _count: { select: { activities: true, registrations: true, boothAssignments: true } },
        },
      }),
    ]);

    return {
      data: events.map(EventMapper.withTiming),
      meta: meta(total),
    };
  }

  static async getById(id) {
    const event = await prisma.event.findFirst({
      where: { id, isDeleted: false },
      include: {
        venue: true,
        settings: true,
        _count: { select: { activities: true, registrations: true, boothAssignments: true } },
      },
    });

    if (!event) {
      throw ApiError.notFound('Không tìm thấy sự kiện');
    }

    return EventMapper.withTiming(event);
  }

  static async create(input, user) {
    const vietnamDay = value => formatDateVietnam(value).dateStr;
    if (vietnamDay(input.startAt) < vietnamDay(new Date())) {
      throw ApiError.validation([{ field: 'startAt', message: 'Không thể tạo sự kiện vào ngày đã diễn ra' }]);
    }
    if (input.venueId) {
      const venue = await prisma.venue.findFirst({
        where: { id: input.venueId, isDeleted: false },
      });
      if (!venue) {
        throw ApiError.validation([{ field: 'venueId', message: 'Địa điểm không tồn tại hoặc đã bị xóa' }]);
      }
    }

    const slug = await this.generateUniqueSlug(input.title);
    const locations = input.venueId ? await prisma.location.findMany({ where: { venueId: input.venueId, isDeleted: false }, select: { id: true } }) : [];

    let titleEn = input.titleEn;
    if (!titleEn && input.title) {
      titleEn = await translateViToEn(input.title);
    }
    let summaryEn = input.summaryEn;
    if (!summaryEn && input.summary) {
      summaryEn = await translateViToEn(input.summary);
    }

    const event = await prisma.event.create({
      data: {
        title: input.title,
        titleEn: titleEn || null,
        visibility: input.visibility || 'public',
        publicUntil: input.publicUntil ? new Date(input.publicUntil) : null,
        coverImageUrl: input.coverImageUrl || null,
        summary: input.summary || null,
        summaryEn: summaryEn || null,
        slug,
        startAt: new Date(input.startAt),
        endAt: new Date(input.endAt),
        venueId: input.venueId || null,
        description: input.description || null,
        priorityLevel: input.priorityLevel || 'regular',
        status: input.status || (input.visibility === 'internal' ? 'draft' : 'published'),
        isDeleted: false,
        createdBy: user?.id || null,
        eventLocations: { create: locations.map(location => ({ locationId: location.id })) },
      },
      include: { venue: true },
    });

    return EventMapper.withTiming(event);
  }

  static async update(id, input) {
    const existing = await prisma.event.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw ApiError.notFound('Không tìm thấy sự kiện');
    }

    const effectiveStart = input.startAt ? new Date(input.startAt) : existing.startAt;
    const effectiveEnd = input.endAt ? new Date(input.endAt) : existing.endAt;

    if (effectiveStart >= effectiveEnd) {
      throw ApiError.validation([
        { field: 'endAt', message: 'Thời gian bắt đầu phải trước thời gian kết thúc' },
      ]);
    }

    if (input.venueId) {
      const venue = await prisma.venue.findFirst({
        where: { id: input.venueId, isDeleted: false },
      });
      if (!venue) {
        throw ApiError.validation([{ field: 'venueId', message: 'Địa điểm không tồn tại hoặc đã bị xóa' }]);
      }
    }

    const updateData = {};
    for (const key of ['visibility','coverImageUrl','summary','summaryEn','titleEn']) if (input[key] !== undefined) updateData[key] = input[key];
    if (input.publicUntil !== undefined) updateData.publicUntil = input.publicUntil ? new Date(input.publicUntil) : null;
    if (input.title !== undefined) updateData.title = input.title;
    if (input.startAt !== undefined) updateData.startAt = new Date(input.startAt);
    if (input.endAt !== undefined) updateData.endAt = new Date(input.endAt);
    if (input.venueId !== undefined) updateData.venueId = input.venueId;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.priorityLevel !== undefined) updateData.priorityLevel = input.priorityLevel;

    // Auto-translate if English counterpart is missing or title/summary updated
    if (input.title !== undefined && (input.titleEn === undefined || !input.titleEn)) {
      updateData.titleEn = await translateViToEn(input.title);
    }
    if (input.summary !== undefined && (input.summaryEn === undefined || !input.summaryEn)) {
      updateData.summaryEn = await translateViToEn(input.summary);
    }

    // slug is immutable - never added to updateData

    const updated = await prisma.event.update({
      where: { id },
      data: updateData,
      include: { venue: true },
    });

    return EventMapper.withTiming(updated);
  }

  static async remove(id) {
    const existing = await prisma.event.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw ApiError.notFound('Không tìm thấy sự kiện');
    }

    await prisma.event.update({
      where: { id },
      data: { isDeleted: true },
    });

    return { message: 'Xóa sự kiện thành công' };
  }
}
