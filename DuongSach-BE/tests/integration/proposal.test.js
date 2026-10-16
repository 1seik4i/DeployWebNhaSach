import { describe, expect, it, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';

const app = createApp();

describe('Proposal Management API (/api/admin/proposals)', () => {
  let adminToken;
  let adminUser;
  let secondAdminToken;
  let partnerToken;
  let baseEventId;
  let baseOrgId;
  let baseLocationId;

  // Helper to create a test proposal with given status
  const createTestProposal = async (status = 'pending', titleSuffix = '', extra = {}) => {
    return prisma.activityProposal.create({
      data: {
        eventId: baseEventId,
        organizationId: baseOrgId,
        locationId: baseLocationId,
        title: `Đề xuất thử nghiệm ${titleSuffix} ${Date.now()}`,
        kind: 'workshop',
        startAt: new Date(Date.now() + 86400000),
        endAt: new Date(Date.now() + 90000000),
        capacity: 50,
        status,
        submittedAt: extra.submittedAt || new Date(),
        ...extra,
      },
    });
  };

  beforeAll(async () => {
    const adminLogin = await request(app).post('/api/auth/demo-login').send({ role: 'admin' });
    adminToken = adminLogin.body.data.accessToken;
    adminUser = adminLogin.body.data.user;

    const organizerLogin = await request(app).post('/api/auth/demo-login').send({ role: 'admin' });
    secondAdminToken = organizerLogin.body.data.accessToken;

    const participantLogin = await request(app).post('/api/auth/demo-login').send({ role: 'partner' });
    partnerToken = participantLogin.body.data.accessToken;

    const event = await prisma.event.findFirst({ where: { isDeleted: false } });
    baseEventId = event?.id;

    const org = await prisma.organization.findFirst({ where: { isDeleted: false } });
    baseOrgId = org?.id;

    const location = await prisma.location.findFirst({ where: { isDeleted: false } });
    baseLocationId = location?.id;
  });

  describe('Authentication & Authorization', () => {
    it('returns 401 when accessing without token', async () => {
      const res = await request(app).get('/api/admin/proposals');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 403 when accessing with non-permitted role (partner)', async () => {
      const res = await request(app)
        .get('/api/admin/proposals')
        .set('Authorization', `Bearer ${partnerToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('allows admin access', async () => {
      const res = await request(app)
        .get('/api/admin/proposals')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('allows another admin session access', async () => {
      const res = await request(app)
        .get('/api/admin/proposals')
        .set('Authorization', `Bearer ${secondAdminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Proposal Listing & Filtering', () => {
    it('lists proposals with pagination meta', async () => {
      const res = await request(app)
        .get('/api/admin/proposals?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(5);
    });

    it('filters proposals by status', async () => {
      await createTestProposal('need_revision', 'filter-need-revision');

      const res = await request(app)
        .get('/api/admin/proposals?status=need_revision')
        .set('Authorization', `Bearer ${secondAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.every(p => p.status === 'need_revision')).toBe(true);
    });

    it('filters proposals by submittedAt using fromDate and toDate', async () => {
      const pastDate = new Date('2025-01-01T00:00:00.000Z');
      const targetDate = new Date('2025-06-15T12:00:00.000Z');
      const endLimit = new Date('2026-01-01T00:00:00.000Z');

      const datedProposal = await createTestProposal('pending', 'dated-item', {
        submittedAt: targetDate,
      });

      const res = await request(app)
        .get('/api/admin/proposals?fromDate=2025-01-01&toDate=2025-12-31')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.some(p => p.id === datedProposal.id)).toBe(true);
      expect(res.body.data.every(p => {
        const sub = new Date(p.submittedAt).getTime();
        return sub >= pastDate.getTime() && sub < endLimit.getTime();
      })).toBe(true);
    });

    it('includes proposals submitted throughout toDate day and excludes proposals after toDate', async () => {
      const middayProposal = await createTestProposal('pending', 'midday-item', {
        submittedAt: new Date('2026-09-30T14:30:00.000Z'),
      });
      const lateDayProposal = await createTestProposal('pending', 'lateday-item', {
        submittedAt: new Date('2026-09-30T23:59:59.000Z'),
      });
      const nextDayProposal = await createTestProposal('pending', 'nextday-item', {
        submittedAt: new Date('2026-10-01T08:00:00.000Z'),
      });

      const res = await request(app)
        .get('/api/admin/proposals?fromDate=2026-09-01&toDate=2026-09-30')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const returnedIds = res.body.data.map(p => p.id);
      expect(returnedIds).toContain(middayProposal.id);
      expect(returnedIds).toContain(lateDayProposal.id);
      expect(returnedIds).not.toContain(nextDayProposal.id);
    });

    it('filters proposals with valid status=pending', async () => {
      await createTestProposal('pending', 'filter-pending');

      const res = await request(app)
        .get('/api/admin/proposals?status=pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.every(p => p.status === 'pending')).toBe(true);
    });

    it('returns validation error when status is invalid', async () => {
      const res = await request(app)
        .get('/api/admin/proposals?status=invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns validation error when fromDate is invalid string', async () => {
      const res = await request(app)
        .get('/api/admin/proposals?fromDate=abc')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns validation error when toDate is invalid string', async () => {
      const res = await request(app)
        .get('/api/admin/proposals?toDate=abc')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns validation error when fromDate has non-existent date 2026-02-30', async () => {
      const res = await request(app)
        .get('/api/admin/proposals?fromDate=2026-02-30')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns validation error when toDate has invalid month 2026-13-01', async () => {
      const res = await request(app)
        .get('/api/admin/proposals?toDate=2026-13-01')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns validation error when fromDate has incorrect format 29/09/2026', async () => {
      const res = await request(app)
        .get('/api/admin/proposals?fromDate=29/09/2026')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns validation error when fromDate is greater than toDate', async () => {
      const res = await request(app)
        .get('/api/admin/proposals?fromDate=2026-10-01&toDate=2026-09-01')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('accepts valid date range filter with fromDate <= toDate', async () => {
      const res = await request(app)
        .get('/api/admin/proposals?fromDate=2026-09-01&toDate=2026-09-30')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Proposal Detail', () => {
    let proposalWithRelations;

    beforeAll(async () => {
      proposalWithRelations = await createTestProposal('pending', 'detail-test');

      // Add a test device
      const asset = await prisma.asset.findFirst({ where: { isDeleted: false } });
      await prisma.proposalDevice.create({
        data: {
          proposalId: proposalWithRelations.id,
          name: 'Micro không dây',
          quantity: 2,
          assetId: asset?.id || null,
        },
      });

      // Add a test review
      await prisma.activityReview.create({
        data: {
          proposalId: proposalWithRelations.id,
          reviewerId: adminUser.id,
          action: 'note',
          note: 'Ghi chú ban đầu',
        },
      });
    });

    it('returns proposal detail with all required relations included', async () => {
      const res = await request(app)
        .get(`/api/admin/proposals/${proposalWithRelations.id}`)
        .set('Authorization', `Bearer ${secondAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(proposalWithRelations.id);
      expect(res.body.data.event).toBeDefined();
      expect(res.body.data.organization).toBeDefined();
      expect(res.body.data.location).toBeDefined();
      expect(Array.isArray(res.body.data.devices)).toBe(true);
      expect(res.body.data.devices.length).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(res.body.data.reviews)).toBe(true);
      expect(res.body.data.reviews.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.reviews[0].reviewer).toBeDefined();
      expect(res.body.data.reviews[0].reviewer.fullName).toBeDefined();
    });

    it('returns 404 for nonexistent proposal id', async () => {
      const res = await request(app)
        .get('/api/admin/proposals/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 422 for invalid uuid', async () => {
      const res = await request(app)
        .get('/api/admin/proposals/not-a-uuid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(422);
    });
  });

  describe('Proposal Approval', () => {
    it('approves a pending proposal and creates ActivityReview', async () => {
      const proposal = await createTestProposal('pending', 'approve-pending');

      const res = await request(app)
        .post(`/api/admin/proposals/${proposal.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ note: 'Đồng ý nội dung và kế hoạch tổ chức' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('approved');
      expect(res.body.data.managementNotes).toBe('Đồng ý nội dung và kế hoạch tổ chức');

      // Verify DB state
      const inDb = await prisma.activityProposal.findUnique({ where: { id: proposal.id } });
      expect(inDb.status).toBe('approved');
      expect(inDb.managementNotes).toBe('Đồng ý nội dung và kế hoạch tổ chức');

      // Verify ActivityReview created
      const reviews = await prisma.activityReview.findMany({ where: { proposalId: proposal.id } });
      expect(reviews.length).toBe(1);
      expect(reviews[0].action).toBe('approve');
      expect(reviews[0].note).toBe('Đồng ý nội dung và kế hoạch tổ chức');
      expect(reviews[0].reviewerId).toBe(adminUser.id);

      // Verify no Activity created
      const activities = await prisma.activity.findMany({ where: { proposalId: proposal.id } });
      expect(activities.length).toBe(0);
    });

    it('approves a need_revision proposal', async () => {
      const proposal = await createTestProposal('need_revision', 'approve-need-rev');

      const res = await request(app)
        .post(`/api/admin/proposals/${proposal.id}/approve`)
        .set('Authorization', `Bearer ${secondAdminToken}`)
        .send({ note: 'Bổ sung đã đầy đủ, phê duyệt' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('approved');
    });

    it('allows approval with note being optional', async () => {
      const proposal = await createTestProposal('pending', 'approve-no-note');

      const res = await request(app)
        .post(`/api/admin/proposals/${proposal.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('approved');

      const reviews = await prisma.activityReview.findMany({ where: { proposalId: proposal.id } });
      expect(reviews.length).toBe(1);
      expect(reviews[0].action).toBe('approve');
    });
  });

  describe('Request Supplement', () => {
    it('fails with 422 if note is missing or empty', async () => {
      const proposal = await createTestProposal('pending', 'supp-empty-note');

      const res = await request(app)
        .post(`/api/admin/proposals/${proposal.id}/request-supplement`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ note: '   ' });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('requests supplement from pending status, setting status to need_revision and creating review', async () => {
      const proposal = await createTestProposal('pending', 'req-supp-valid');

      const res = await request(app)
        .post(`/api/admin/proposals/${proposal.id}/request-supplement`)
        .set('Authorization', `Bearer ${secondAdminToken}`)
        .send({ note: 'Vui lòng bổ sung danh sách diễn giả và kịch bản chi tiết' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('need_revision');
      expect(res.body.data.managementNotes).toBe('Vui lòng bổ sung danh sách diễn giả và kịch bản chi tiết');

      const inDb = await prisma.activityProposal.findUnique({ where: { id: proposal.id } });
      expect(inDb.status).toBe('need_revision');

      const reviews = await prisma.activityReview.findMany({ where: { proposalId: proposal.id } });
      expect(reviews.length).toBe(1);
      expect(reviews[0].action).toBe('request_supplement');
      expect(reviews[0].note).toBe('Vui lòng bổ sung danh sách diễn giả và kịch bản chi tiết');
    });

    it('cannot request supplement if status is not pending (e.g. need_revision)', async () => {
      const proposal = await createTestProposal('need_revision', 'supp-not-pending');

      const res = await request(app)
        .post(`/api/admin/proposals/${proposal.id}/request-supplement`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ note: 'Yêu cầu tiếp' });

      expect(res.status).toBe(409);
    });
  });

  describe('Proposal Rejection', () => {
    it('fails with 422 if note is missing or empty', async () => {
      const proposal = await createTestProposal('pending', 'reject-empty-note');

      const res = await request(app)
        .post(`/api/admin/proposals/${proposal.id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ note: '' });

      expect(res.status).toBe(422);
    });

    it('rejects a pending proposal, setting status to rejected and creating review', async () => {
      const proposal = await createTestProposal('pending', 'reject-pending');

      const res = await request(app)
        .post(`/api/admin/proposals/${proposal.id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ note: 'Chủ đề không phù hợp với định hướng tuần lễ sách' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('rejected');
      expect(res.body.data.managementNotes).toBe('Chủ đề không phù hợp với định hướng tuần lễ sách');

      const inDb = await prisma.activityProposal.findUnique({ where: { id: proposal.id } });
      expect(inDb.status).toBe('rejected');

      const reviews = await prisma.activityReview.findMany({ where: { proposalId: proposal.id } });
      expect(reviews.length).toBe(1);
      expect(reviews[0].action).toBe('reject');
      expect(reviews[0].note).toBe('Chủ đề không phù hợp với định hướng tuần lễ sách');
    });

    it('rejects a need_revision proposal', async () => {
      const proposal = await createTestProposal('need_revision', 'reject-need-rev');

      const res = await request(app)
        .post(`/api/admin/proposals/${proposal.id}/reject`)
        .set('Authorization', `Bearer ${secondAdminToken}`)
        .send({ note: 'Hết hạn nộp bổ sung nhưng đối tác không phản hồi' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('rejected');
    });
  });

  describe('Invalid Proposal Transitions', () => {
    it('cannot review (approve/request-supplement/reject) on approved proposal', async () => {
      const proposal = await createTestProposal('approved', 'invalid-from-approved');

      const approveRes = await request(app)
        .post(`/api/admin/proposals/${proposal.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(approveRes.status).toBe(409);

      const suppRes = await request(app)
        .post(`/api/admin/proposals/${proposal.id}/request-supplement`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ note: 'Yêu cầu sửa đổi' });
      expect(suppRes.status).toBe(409);

      const rejectRes = await request(app)
        .post(`/api/admin/proposals/${proposal.id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ note: 'Từ chối sau khi đã duyệt' });
      expect(rejectRes.status).toBe(409);
    });

    it('cannot review on rejected proposal', async () => {
      const proposal = await createTestProposal('rejected', 'invalid-from-rejected');

      const approveRes = await request(app)
        .post(`/api/admin/proposals/${proposal.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(approveRes.status).toBe(409);

      const rejectRes = await request(app)
        .post(`/api/admin/proposals/${proposal.id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ note: 'Từ chối lại' });
      expect(rejectRes.status).toBe(409);
    });

    it('cannot review on withdrawn proposal', async () => {
      const proposal = await createTestProposal('withdrawn', 'invalid-from-withdrawn');

      const approveRes = await request(app)
        .post(`/api/admin/proposals/${proposal.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(approveRes.status).toBe(409);

      const suppRes = await request(app)
        .post(`/api/admin/proposals/${proposal.id}/request-supplement`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ note: 'Yêu cầu bổ sung' });
      expect(suppRes.status).toBe(409);

      const rejectRes = await request(app)
        .post(`/api/admin/proposals/${proposal.id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ note: 'Từ chối đề xuất đã rút' });
      expect(rejectRes.status).toBe(409);
    });
  });
});
