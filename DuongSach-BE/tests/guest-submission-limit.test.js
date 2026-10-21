import { beforeEach, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
vi.mock('../src/config/database.js', () => {
  const prisma = {
    guestSubmissionSession: { upsert: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn() },
    feedback: { create: vi.fn() }, eventSuggestion: { create: vi.fn() },
  };
  prisma.$transaction = vi.fn();
  return { prisma };
});
import { prisma } from '../src/config/database.js';
import router from '../src/modules/public/content.routes.js';
const app = express(); app.use(express.json()); app.use('/api', router);
app.use((error, req, res, next) => res.status(error.statusCode || 500).json({ error: { code: error.code, message: error.message } }));
const feedback = { rating: 5, comments: 'Feedback from a visitor' };
const proposal = { fullName: 'Nguyễn Văn An', phone: '0912345678', content: 'Đề xuất buổi giao lưu tác giả.' };
let sessions, savedFeedback, savedProposals, queue;
beforeEach(() => {
  vi.clearAllMocks(); sessions = new Map(); savedFeedback = []; savedProposals = []; queue = Promise.resolve();
  prisma.guestSubmissionSession.upsert.mockImplementation(async ({ where }) => {
    if (!sessions.has(where.id)) sessions.set(where.id, { id: where.id, feedbackCount: 0, proposalCount: 0 });
    return sessions.get(where.id);
  });
  prisma.guestSubmissionSession.findUnique.mockImplementation(async ({ where }) => sessions.get(where.id) || null);
  prisma.guestSubmissionSession.updateMany.mockImplementation(async ({ where, data }) => {
    const row = sessions.get(where.id), field = Object.keys(data)[0];
    if (row[field] >= where[field].lt) return { count: 0 };
    row[field]++; return { count: 1 };
  });
  // Emulate PostgreSQL's transactional row locking and rollback for HTTP tests.
  prisma.$transaction.mockImplementation(work => {
    const result = queue.then(async () => {
      const before = structuredClone(sessions);
      try { return await work(prisma); } catch (error) { sessions = before; throw error; }
    });
    queue = result.catch(() => {}); return result;
  });
  prisma.feedback.create.mockImplementation(async () => { const row = { id: `f-${savedFeedback.length}`, status: 'new' }; savedFeedback.push(row); return row; });
  prisma.eventSuggestion.create.mockImplementation(async () => { const row = { id: `p-${savedProposals.length}`, status: 'new' }; savedProposals.push(row); return row; });
});
const send = (path, session, data) => request(app).post(`/api/public/${path}`).set('X-Guest-Session', session).send(data);
it('stores three feedback submissions and rejects the fourth with 429', async () => {
  const session = randomUUID();
  for (let i = 1; i <= 3; i++) {
    const response = await send('feedbacks', session, feedback);
    expect(response.status).toBe(200);
    expect(response.body.data.submissionQuota).toEqual({ limit: 3, used: i, remaining: 3 - i });
  }
  const blocked = await send('feedbacks', session, feedback);
  expect(blocked.status).toBe(429); expect(blocked.body.error.code).toBe('GUEST_SUBMISSION_LIMIT');
  expect(savedFeedback).toHaveLength(3);
  const status = await request(app).get('/api/public/submission-quota').set('X-Guest-Session', session);
  expect(status.body.data.feedback.remaining).toBe(0);
  expect(status.body.data.eventProposal.remaining).toBe(3);
});
it('uses an independent three-submission quota per form and per session', async () => {
  const first = randomUUID(), second = randomUUID();
  for (let i = 0; i < 3; i++) expect((await send('feedbacks', first, feedback)).status).toBe(200);
  for (let i = 0; i < 3; i++) expect((await send('event-suggestions', first, proposal)).status).toBe(200);
  expect((await send('event-suggestions', first, proposal)).status).toBe(429);
  expect((await send('feedbacks', second, feedback)).status).toBe(200);
  expect(savedProposals).toHaveLength(3);
});
it('does not spend a slot on validation or failed database writes', async () => {
  const session = randomUUID();
  expect((await send('event-suggestions', session, { ...proposal, phone: '123' })).status).toBe(422);
  expect(prisma.$transaction).not.toHaveBeenCalled();
  prisma.feedback.create.mockRejectedValueOnce(new Error('Database failure'));
  expect((await send('feedbacks', session, feedback)).status).toBe(500);
  expect(sessions.has(session)).toBe(false);
  expect((await send('feedbacks', session, feedback)).body.data.submissionQuota.used).toBe(1);
});
it('accepts only three concurrent requests for the same session', async () => {
  const session = randomUUID();
  const results = await Promise.all(Array.from({ length: 6 }, () => send('feedbacks', session, feedback)));
  expect(results.filter(row => row.status === 200)).toHaveLength(3);
  expect(results.filter(row => row.status === 429)).toHaveLength(3);
  expect(savedFeedback).toHaveLength(3);
  expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({ isolationLevel: 'ReadCommitted' }));
});
it('supports session cookies for older callers without the session header', async () => {
  const browser = request.agent(app);
  for (let i = 0; i < 3; i++) expect((await browser.post('/api/public/event-suggestions').send(proposal)).status).toBe(200);
  expect((await browser.post('/api/public/event-suggestions').send(proposal)).status).toBe(429);
});
it('rejects malformed session headers and does not change payload schemas', async () => {
  expect((await send('feedbacks', 'not-a-session', feedback)).status).toBe(422);
  expect(prisma.feedback.create).not.toHaveBeenCalled();
  const response = await send('event-suggestions', randomUUID(), proposal);
  expect(response.status).toBe(200);
  expect(prisma.eventSuggestion.create.mock.calls[0][0].data).toEqual(proposal);
});
