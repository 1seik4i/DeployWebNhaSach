import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../src/config/database.js', () => {
  const prisma = { feedback: { create: vi.fn() }, guestSubmissionSession: { upsert: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn() } };
  prisma.$transaction = vi.fn(fn => fn(prisma));
  return { prisma };
});
import { prisma } from '../src/config/database.js';
import router from '../src/modules/public/content.routes.js';
import { feedbackContactError } from '../../DuongSach-FE/src/utils/feedbackContact';

const app = express();
app.use(express.json());
app.use('/api', router);
app.use((error, req, res, next) => res.status(error.statusCode || 500).json({ details: error.details }));
beforeEach(() => {
  vi.clearAllMocks();
  prisma.guestSubmissionSession.updateMany.mockResolvedValue({ count: 1 });
  prisma.guestSubmissionSession.findUnique.mockResolvedValue({ feedbackCount: 1, proposalCount: 0 });
  prisma.feedback.create.mockResolvedValue({ id: 'feedback', status: 'new' });
});

describe('optional feedback email or Vietnamese phone', () => {
  it.each(['sdfs', '123', '0123456789', '09123456789', '09123abc78', 'test@', 'a@b', '+1 912345678'])('rejects invalid contact %s on both client and server', async contactEmail => {
    expect(feedbackContactError(contactEmail, 'vi')).not.toBe('');
    const response = await request(app).post('/api/public/feedbacks').send({ rating: 5, comments: 'Feedback', contactEmail });
    expect(response.status).toBe(422);
    expect(response.body.details).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'contactEmail' })]));
    expect(prisma.feedback.create).not.toHaveBeenCalled();
  });
  it.each(['', '   ', 'name@example.com', '0912345678', '+84912345678', ' 090 123 4567 ', '02812345678'])('accepts and preserves valid contact %s', async contactEmail => {
    expect(feedbackContactError(contactEmail, 'vi')).toBe('');
    const response = await request(app).post('/api/public/feedbacks').send({ rating: 5, comments: 'Feedback', contactEmail });
    expect(response.status).toBe(200);
    expect(prisma.feedback.create).toHaveBeenCalledWith({ data: expect.objectContaining({ contactEmail: contactEmail.trim() || null }) });
  });
});
