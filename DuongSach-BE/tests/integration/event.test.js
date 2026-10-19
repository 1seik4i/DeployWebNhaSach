import { describe, expect, it, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';

const app = createApp();

describe('Event Management API (/api/admin/events)', () => {
  let adminToken;
  let secondAdminToken;
  let partnerToken;
  let validVenueId;
  let deletedVenueId;

  beforeAll(async () => {
    // Obtain tokens using demo login
    const adminLogin = await request(app).post('/api/auth/demo-login').send({ role: 'admin' });
    adminToken = adminLogin.body.data.accessToken;

    const organizerLogin = await request(app).post('/api/auth/demo-login').send({ role: 'admin' });
    secondAdminToken = organizerLogin.body.data.accessToken;

    const participantLogin = await request(app).post('/api/auth/demo-login').send({ role: 'partner' });
    partnerToken = participantLogin.body.data.accessToken;

    // Find or create an active venue for testing
    let venue = await prisma.venue.findFirst({ where: { isDeleted: false } });
    if (!venue) {
      venue = await prisma.venue.create({
        data: {
          name: 'Sân Khấu A',
          facility: 'Đường Sách Nguyễn Văn Bình',
          capacity: 200,
        },
      });
    }
    validVenueId = venue.id;

    // Create a deleted venue for testing
    const deletedVenue = await prisma.venue.create({
      data: {
        name: 'Sân Khấu Đã Xóa ' + Date.now(),
        facility: 'Đường Sách Test',
        capacity: 100,
        isDeleted: true,
      },
    });
    deletedVenueId = deletedVenue.id;
  });

  describe('Authentication & Authorization', () => {
    it('returns 401 when accessing without token', async () => {
      const res = await request(app).get('/api/admin/events');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 403 when accessing with invalid role (partner)', async () => {
      const res = await request(app)
        .get('/api/admin/events')
        .set('Authorization', `Bearer ${partnerToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('allows admin access', async () => {
      const res = await request(app)
        .get('/api/admin/events')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('allows another admin session access', async () => {
      const res = await request(app)
        .get('/api/admin/events')
        .set('Authorization', `Bearer ${secondAdminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Event Creation & Validation', () => {
    it('creates an event with valid payload and generates slug', async () => {
      const payload = {
        title: 'Ngày hội sách thiếu nhi ' + Date.now(),
        startAt: '2026-11-01T08:00:00.000Z',
        endAt: '2026-11-05T18:00:00.000Z',
        venueId: validVenueId,
        description: 'Mô tả sự kiện hội sách',
        priorityLevel: 'high',
      };

      const res = await request(app)
        .post('/api/admin/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe(payload.title);
      expect(res.body.data.slug).toContain('ngay-hoi-sach-thieu-nhi');
      expect(res.body.data.priorityLevel).toBe('high');
      expect(res.body.data.status).toBe('published');
      expect(res.body.data.isDeleted).toBe(false);
      expect(res.body.data.venueId).toBe(validVenueId);
      expect(res.body.data.venue).toBeDefined();
    });

    it('generates unique incremental slug on duplicate title', async () => {
      const uniqueBase = 'Hội sách mùa thu ' + Math.floor(Math.random() * 100000);
      const payload = {
        title: uniqueBase,
        startAt: '2026-12-01T08:00:00.000Z',
        endAt: '2026-12-05T18:00:00.000Z',
      };

      const res1 = await request(app)
        .post('/api/admin/events')
        .set('Authorization', `Bearer ${secondAdminToken}`)
        .send(payload);
      expect(res1.status).toBe(201);
      const slug1 = res1.body.data.slug;

      const res2 = await request(app)
        .post('/api/admin/events')
        .set('Authorization', `Bearer ${secondAdminToken}`)
        .send(payload);
      expect(res2.status).toBe(201);
      const slug2 = res2.body.data.slug;

      const res3 = await request(app)
        .post('/api/admin/events')
        .set('Authorization', `Bearer ${secondAdminToken}`)
        .send(payload);
      expect(res3.status).toBe(201);
      const slug3 = res3.body.data.slug;

      expect(slug2).toBe(`${slug1}-2`);
      expect(slug3).toBe(`${slug1}-3`);
    });

    it('fails with 422 when title is missing or empty', async () => {
      const res = await request(app)
        .post('/api/admin/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: '   ',
          startAt: '2026-11-01T08:00:00.000Z',
          endAt: '2026-11-05T18:00:00.000Z',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('fails with 422 when startAt >= endAt', async () => {
      const res = await request(app)
        .post('/api/admin/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Sự kiện sai thời gian',
          startAt: '2026-11-05T18:00:00.000Z',
          endAt: '2026-11-01T08:00:00.000Z',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('fails with 422 when priority is invalid', async () => {
      const res = await request(app)
        .post('/api/admin/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Sự kiện sai priority',
          startAt: '2026-11-01T08:00:00.000Z',
          endAt: '2026-11-05T18:00:00.000Z',
          priorityLevel: 'ultra-high',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('fails when venueId is invalid format, nonexistent, or deleted', async () => {
      // Invalid UUID
      const resInvalid = await request(app)
        .post('/api/admin/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Sự kiện venue không hợp lệ',
          startAt: '2026-11-01T08:00:00.000Z',
          endAt: '2026-11-05T18:00:00.000Z',
          venueId: 'not-a-uuid',
        });
      expect(resInvalid.status).toBe(422);

      // Nonexistent UUID
      const resNonexistent = await request(app)
        .post('/api/admin/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Sự kiện venue không tồn tại',
          startAt: '2026-11-01T08:00:00.000Z',
          endAt: '2026-11-05T18:00:00.000Z',
          venueId: '00000000-0000-0000-0000-000000000000',
        });
      expect(resNonexistent.status).toBe(422);

      // Deleted venue
      const resDeleted = await request(app)
        .post('/api/admin/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Sự kiện venue đã xóa',
          startAt: '2026-11-01T08:00:00.000Z',
          endAt: '2026-11-05T18:00:00.000Z',
          venueId: deletedVenueId,
        });
      expect(resDeleted.status).toBe(422);
    });
  });

  describe('Event Listing & Filtering', () => {
    let createdEventId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/admin/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Triển lãm tranh Đông Hồ ' + Date.now(),
          startAt: new Date(Date.now() + 30 * 86400000).toISOString(),
          endAt: new Date(Date.now() + 35 * 86400000).toISOString(),
          priorityLevel: 'medium',
        });
      expect(res.status, JSON.stringify(res.body)).toBe(201);
      createdEventId = res.body.data.id;
    });

    it('lists events with pagination meta', async () => {
      const res = await request(app)
        .get('/api/admin/events?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(5);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
    });

    it('searches events by title case-insensitively', async () => {
      const res = await request(app)
        .get('/api/admin/events?search=tranh đông hồ')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].title.toLowerCase()).toContain('tranh đông hồ');
    });

    it('filters events by priorityLevel', async () => {
      const res = await request(app)
        .get('/api/admin/events?priorityLevel=medium')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(e => e.priorityLevel === 'medium')).toBe(true);
    });

    it('filters events by status', async () => {
      const res = await request(app)
        .get('/api/admin/events?status=draft')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(e => e.status === 'draft')).toBe(true);
    });

    it('returns validation error when priorityLevel is invalid', async () => {
      const res = await request(app)
        .get('/api/admin/events?priorityLevel=invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns validation error when status is invalid', async () => {
      const res = await request(app)
        .get('/api/admin/events?status=invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Event Detail', () => {
    let testEvent;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/admin/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Chi tiết sự kiện test ' + Date.now(),
          startAt: '2026-11-10T08:00:00.000Z',
          endAt: '2026-11-15T18:00:00.000Z',
          venueId: validVenueId,
        });
      testEvent = res.body.data;
    });

    it('returns event detail with venue included', async () => {
      const res = await request(app)
        .get(`/api/admin/events/${testEvent.id}`)
        .set('Authorization', `Bearer ${secondAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testEvent.id);
      expect(res.body.data.title).toBe(testEvent.title);
      expect(res.body.data.slug).toBe(testEvent.slug);
      expect(res.body.data.venue).toBeDefined();
      expect(res.body.data.venue.id).toBe(validVenueId);
    });

    it('returns 404 for nonexistent event id', async () => {
      const res = await request(app)
        .get('/api/admin/events/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 422 for invalid uuid parameter', async () => {
      const res = await request(app)
        .get('/api/admin/events/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(422);
    });
  });

  describe('Event Update & Slug Immutability', () => {
    let eventToUpdate;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/admin/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Tên Ban Đầu ' + Date.now(),
          startAt: '2026-12-10T08:00:00.000Z',
          endAt: '2026-12-15T18:00:00.000Z',
          priorityLevel: 'regular',
        });
      eventToUpdate = res.body.data;
    });

    it('updates event fields and DOES NOT change slug when title changes', async () => {
      const originalSlug = eventToUpdate.slug;
      const newTitle = 'Tên Hoàn Toàn Mới Sau Khi Cập Nhật ' + Date.now();

      const res = await request(app)
        .put(`/api/admin/events/${eventToUpdate.id}`)
        .set('Authorization', `Bearer ${secondAdminToken}`)
        .send({
          title: newTitle,
          description: 'Mô tả mới được cập nhật',
          priorityLevel: 'high',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe(newTitle);
      expect(res.body.data.description).toBe('Mô tả mới được cập nhật');
      expect(res.body.data.priorityLevel).toBe('high');
      expect(res.body.data.slug).toBe(originalSlug); // Slug immutable!
    });

    it('validates partial time update against existing event startAt/endAt', async () => {
      // Trying to set startAt after existing endAt (2026-12-15)
      const res = await request(app)
        .put(`/api/admin/events/${eventToUpdate.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          startAt: '2026-12-20T00:00:00.000Z',
        });

      expect(res.status).toBe(422);
    });
  });

  describe('Event Soft Delete', () => {
    let eventToDelete;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/admin/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Sự kiện sẽ bị xóa ' + Date.now(),
          startAt: '2026-12-20T08:00:00.000Z',
          endAt: '2026-12-25T18:00:00.000Z',
        });
      eventToDelete = res.body.data;
    });

    it('soft deletes event setting isDeleted = true', async () => {
      const res = await request(app)
        .delete(`/api/admin/events/${eventToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify in DB that isDeleted is true
      const inDb = await prisma.event.findUnique({ where: { id: eventToDelete.id } });
      expect(inDb.isDeleted).toBe(true);
    });

    it('excludes soft-deleted event from list and detail', async () => {
      const getDetail = await request(app)
        .get(`/api/admin/events/${eventToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(getDetail.status).toBe(404);

      const listRes = await request(app)
        .get(`/api/admin/events?search=${encodeURIComponent(eventToDelete.title)}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.some(e => e.id === eventToDelete.id)).toBe(false);
    });
  });
});
