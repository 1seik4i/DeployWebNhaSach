import { Router } from 'express';
import { prisma } from '../../config/database.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { BoothMapper } from '../booth/booth.mapper.js';
import { EventMapper } from '../event/event.mapper.js';
import { HeritageService } from '../heritage/heritage.service.js';
import { publicEventWhere } from '../event/visibility.js';
import { FacilityService } from '../facility/facility.service.js';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { parse, transaction } from '../../utils/contract.js';
import { ApiError } from '../../utils/ApiError.js';

const router = Router();
for (const kind of ['booths', 'venues', 'locations']) {
  router.get(`/${kind}/:id`, asyncHandler(async (req, res) => {
    const row = await FacilityService.get(kind, req.params.id);
    const data = Object.fromEntries(['id', 'name', 'code', 'description', 'publisher', 'openHours', 'imageUrl', 'capacity', 'campus', 'facility', 'zone'].filter(key => row[key] !== undefined && !(kind === 'booths' && key === 'capacity')).map(key => [key, row[key]]));
    return ApiResponse.success(res, data);
  }));
}

const startOfTodayVietnam = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date()).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
  return new Date(`${parts.year}-${parts.month}-${parts.day}T00:00:00+07:00`);
};

// UC-G01: Khám phá Đường Sách - Danh sách gian hàng
router.get('/booths', asyncHandler(async (req, res) => {
  const booths = await prisma.booth.findMany({
    where: { isDeleted: false },
    include: {
      location: true,
      bookStalls: {
        include: { book: true },
        orderBy: [
          { soldQuantity: 'desc' },
          { inventoryQuantity: 'desc' },
        ],
      },
    },
  });
  const data = booths.map(b => BoothMapper.toClient(b));
  return ApiResponse.success(res, data);
}));

// Danh sách sự kiện công khai
router.get('/events', asyncHandler(async (req, res) => {
  const today = startOfTodayVietnam();
  const events = await prisma.event.findMany({
    where: await publicEventWhere(),
    include: {
      venue: true,
      activities: {
        where: { status: { in: ['published', 'ongoing'] } },
        orderBy: { startAt: 'asc' },
      },
      _count: { select: { activities: true } },
    },
    orderBy: { startAt: 'asc' },
  });
  const data = events
    .map(e => EventMapper.toClient(e))
    .sort((a, b) => {
      const priority = { happening: 0, upcoming: 1, completed: 2 };
      return (priority[a.status] ?? 3) - (priority[b.status] ?? 3)
        || new Date(a.startAt) - new Date(b.startAt);
    });
  return ApiResponse.success(res, data);
}));

// Public activities are deliberately separate from events: an activity only
// becomes visible after the organizer has explicitly published it (BR-57).
router.get('/activities', asyncHandler(async (req, res) => {
  const today = startOfTodayVietnam();
  const activities = await prisma.activity.findMany({
    where: {
      status: { in: ['published', 'ongoing'] },
      event: await publicEventWhere(),
    },
    include: { event: { include: { venue: true } }, location: { include: { venue: true } } },
    orderBy: { startAt: 'asc' },
  });

  return ApiResponse.success(res, activities.map(activity => ({
    id: activity.id,
    eventId: activity.eventId,
    eventTitle: activity.event.title,
    title: activity.title,
    titleEn: activity.titleEn || activity.title,
    kind: activity.kind,
    description: activity.description || '',
    speaker: activity.speaker || '',
    startAt: activity.startAt,
    endAt: activity.endAt,
    capacity: activity.capacity,
    registeredCount: activity.registeredCount,
    imageUrl: activity.imageUrl || null,
    location: activity.location.name,
    venue: activity.location.venue?.name || null,
  })));
}));

// Danh sách di sản công khai
router.get('/heritages', asyncHandler(async (req, res) => {
  const heritages = await prisma.heritage.findMany({
    where: { isDeleted: false, status: 'published' },
    orderBy: { code: 'asc' },
  });
  return ApiResponse.success(res, heritages);
}));

// Chi tiết di sản
router.get('/heritages/:slug', asyncHandler(async (req, res) => {
  const heritage = await HeritageService.getHeritageBySlug(req.params.slug);
  return ApiResponse.success(res, heritage);
}));

// Dữ liệu bản đồ công khai dùng cùng nguồn chuẩn với màn quản trị gian hàng.
router.get('/map-hotspots', asyncHandler(async (req, res) => {
  const config = await prisma.setting.findUnique({ where: { key: 'public.map' } });
  const venueId = typeof config?.value?.venueId === 'string' ? config.value.venueId : undefined;
  return ApiResponse.success(res, await FacilityService.listMapBooths({ venueId }));
}));

// Đăng ký tham gia sự kiện công khai và thông báo cho Admin
router.post('/events/:id/register', asyncHandler(async (req, res) => {
  const eventId = parse(z.string().uuid(), req.params.id);
  const body = req.body || {};

  const { fullName, email, phone, attendeesCount, notes } = parse(z.object({
    fullName: z.string().trim().min(1).max(200),
    email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
    phone: z.string().trim().min(8).max(30),
    attendeesCount: z.number().int().positive().max(2147483647).default(1),
    notes: z.string().trim().max(5000).nullable().optional().transform(value => value || null),
  }).strict(), body);

  const event = await prisma.event.findFirst({
    where: { id: eventId, isDeleted: false },
    include: { venue: true },
  });

  if (!event) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy sự kiện.',
    });
  }

  if (event.visibility !== 'public' || !['published', 'ongoing'].includes(event.status) || event.endAt <= new Date()) {
    throw ApiError.conflict('Sự kiện hiện không nhận đăng ký');
  }
  const registration = await transaction(async tx => {
    const current = await tx.event.findFirst({ where: { id: eventId, isDeleted: false } });
    if (!current || current.visibility !== 'public' || !['published', 'ongoing'].includes(current.status) || current.endAt <= new Date()) throw ApiError.conflict('Sự kiện hiện không nhận đăng ký');
    const existing = await tx.publicEventRegistration.findUnique({ where: { eventId_email: { eventId, email } } });
    if (existing) {
      if (existing.fullName !== fullName || existing.phone !== phone) throw ApiError.conflict('Email này đã đăng ký sự kiện');
      return existing;
    }
    const row = await tx.publicEventRegistration.create({ data: { eventId, fullName, email, phone, attendeesCount, notes, registrationCode: `EVT-${randomUUID().toUpperCase()}` } });
    const admins = await tx.user.findMany({ where: { primaryRole: 'admin', status: 'active', isDeleted: false }, select: { id: true } });
    if (admins.length) await tx.notification.createMany({ data: admins.map(admin => ({ userId: admin.id, title: 'Đăng ký sự kiện mới', message: `${fullName} đăng ký ${attendeesCount} người tham dự ${event.title}.`, kind: 'system', link: '/admin?tab=events' })) });
    await tx.auditLog.create({ data: { action: 'event_registration', targetType: 'Event', targetId: eventId, targetTitle: event.title, afterData: { ...row, createdAt: row.createdAt.toISOString() } } });
    return row;
  });
  return ApiResponse.success(res, { ...registration, success: true, eventTitle: event.title, registeredAt: registration.createdAt.toISOString() });

}));

export default router;
