import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { authenticate } from '../../middlewares/auth.js';
import { authorize } from '../../middlewares/rbac.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { audit, organization, parse, transaction, uuid, text, quantity } from '../../utils/contract.js';
import { eventImageInput } from '../../utils/eventImage.js';
import { vietnamDateKey } from './event-time.js';
import { slugify } from './event.service.js';

export const independentEventInput = z.object({
  title: text,
  kind: z.enum(['talkshow', 'workshop', 'launch', 'exhibition', 'minigame', 'signing']),
  locationId: uuid,
  startAt: z.string().datetime({ offset: true }),
  endAt: z.string().datetime({ offset: true }),
  capacity: quantity.default(50),
  description: z.string().max(20000).optional(),
  targetAudience: z.string().trim().min(1).max(2000).optional(),
  speaker: z.string().trim().max(160).optional(),
  imageUrl: eventImageInput,
  isPublished: z.boolean().optional(),
  devices: z.array(z.object({ name: text, quantity }).strict()).max(100).optional(),
}).strict().refine(data => new Date(data.startAt) < new Date(data.endAt), {
  path: ['endAt'], message: 'Ngày giờ kết thúc phải sau ngày giờ bắt đầu.',
});

export async function registerIndependentEvent(input, user) {
  const data = parse(independentEventInput, input);
  if (user.primaryRole === 'partner' && vietnamDateKey(data.startAt) < vietnamDateKey(new Date())) {
    throw ApiError.validation([{ field: 'startAt', message: 'Không thể đăng ký sự kiện vào ngày đã qua.' }]);
  }
  if (user.primaryRole === 'partner' && !data.targetAudience) throw ApiError.validation([{ field: 'targetAudience', message: 'Vui lòng nhập đối tượng tham gia.' }]);
  return transaction(async tx => {
    const location = await tx.location.findFirst({ where: { id: data.locationId, isDeleted: false } });
    if (!location) throw ApiError.validation([{ field: 'locationId', message: 'Địa điểm không tồn tại hoặc đã bị xóa.' }]);
    const partner = user.primaryRole === 'partner';
    const org = partner ? await organization(user.id, tx) : null;
    const published = !partner && data.isPublished !== false;
    // Always create a fresh event. Never use another event's dates or locations.
    const event = await tx.event.create({ data: {
      title: data.title,
      slug: `${slugify(data.title).slice(0, 150) || 'event'}-${crypto.randomUUID()}`,
      startAt: new Date(data.startAt), endAt: new Date(data.endAt),
      venueId: location.venueId,
      description: data.description || null,
      coverImageUrl: data.imageUrl || null,
      status: published ? 'published' : 'draft',
      visibility: published ? 'public' : 'internal',
      publishedAt: published ? new Date() : null,
      createdBy: user.id,
      eventLocations: { create: { locationId: location.id } },
    } });
    const program = {
      eventId: event.id, title: data.title, kind: data.kind, locationId: location.id,
      startAt: new Date(data.startAt), endAt: new Date(data.endAt),
      capacity: data.capacity, description: data.description, speaker: data.speaker,
    };
    if (partner) {
      // Reuse the review queue, owned by this newly created independent event.
      const registration = await tx.activityProposal.create({ data: {
        ...program, targetAudience: data.targetAudience, organizationId: org.id, status: 'pending',
        managementNotes: JSON.stringify({ standaloneEvent: true, imageUrl: data.imageUrl || '' }),
        ...(data.devices?.length ? { devices: { create: data.devices } } : {}),
      } });
      const admins = await tx.user.findMany({ where: { primaryRole: 'admin', isDeleted: false }, select: { id: true } });
      if (admins.length) await tx.notification.createMany({ data: admins.map(admin => ({
        userId: admin.id, title: 'Đăng ký sự kiện mới', message: `${org.name}: ${data.title}`,
        kind: 'system', link: '/admin/activities',
      })) });
      await audit(tx, user, 'create', 'Event', event.id, { registrationId: registration.id });
      return { id: event.id, registrationId: registration.id, status: 'pending' };
    }
    await tx.activity.create({ data: { ...program, imageUrl: data.imageUrl || null, status: published ? 'published' : 'draft', publishedAt: published ? new Date() : null, createdBy: user.id } });
    await audit(tx, user, 'create', 'Event', event.id);
    return { id: event.id, status: event.status };
  });
}

const router = Router();
for (const role of ['admin', 'partner']) {
  router.post(`/${role}/event-registrations`, authenticate, authorize(role), asyncHandler(async (req, res) =>
    ApiResponse.success(res, await registerIndependentEvent(req.body, req.user))));
}
export default router;
