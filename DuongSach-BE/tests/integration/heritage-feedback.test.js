import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';
import { config } from '../../src/config/env.js';

const app = createApp();
const prefix = `heritage-test-${randomUUID()}`;
const heritageIds = [];
const userIds = [];
let admin, token, partnerToken, heritage, other, feedbacks;
const oldPublicUrl = config.publicWebUrl;
const api = (method, path) => request(app)[method](`/api/admin${path}`).set('Authorization', `Bearer ${token}`);
const createHeritage = async (extra = {}) => {
  const row = await prisma.heritage.create({ data: { name: prefix, slug: `${prefix}-${randomUUID()}`, status: 'published', ...extra } });
  heritageIds.push(row.id);
  return row;
};

beforeAll(async () => {
  config.publicWebUrl = 'https://heritage.example.test/site/';
  for (const role of ['admin', 'partner']) {
    const user = await prisma.user.create({ data: {
      fullName: prefix, email: `${role}-${prefix}@example.test`, passwordHash: 'unused-test-hash', primaryRole: role, status: 'active',
    } });
    userIds.push(user.id);
    const signed = jwt.sign({ userId: user.id }, config.jwt.accessSecret, { expiresIn: '10m' });
    if (role === 'admin') { admin = user; token = signed; } else partnerToken = signed;
  }
  heritage = await createHeritage();
  other = await createHeritage({ status: 'draft' });
  feedbacks = [];
  for (const [index, values] of [
    { heritageId: heritage.id, rating: 2, status: 'new' },
    { heritageId: heritage.id, rating: 5, status: 'closed' },
    { heritageId: other.id, rating: 2, status: 'new' },
  ].entries()) {
    feedbacks.push(await prisma.feedback.create({ data: {
      ...values, targetScope: 'heritage', comments: 'Private feedback', internalNote: 'Private note',
      contactEmail: 'private@example.test', createdAt: new Date(Date.UTC(2025, 0, index + 1)),
    } }));
  }
});

afterAll(async () => {
  config.publicWebUrl = oldPublicUrl;
  await prisma.feedback.deleteMany({ where: { heritageId: { in: heritageIds } } });
  await prisma.heritageQrCode.deleteMany({ where: { heritageId: { in: heritageIds } } });
  await prisma.heritage.deleteMany({ where: { id: { in: heritageIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

describe('Admin Heritage', () => {
  it('lists with search, status and pagination', async () => {
    const res = await api('get', '/heritages').query({ search: prefix.toUpperCase(), status: 'published', page: 1, limit: 1 });
    expect(res.status).toBe(200);
    expect(res.body.data.map(row => row.id)).toEqual([heritage.id]);
    expect(res.body.meta).toMatchObject({ total: 1, page: 1, limit: 1 });
  });
  it('returns full detail', async () => {
    const res = await api('get', `/heritages/${heritage.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: heritage.id, slug: heritage.slug, highlights: [], nameEn: null });
  });
  it('creates bilingual content and normalizes the slug', async () => {
    const res = await api('post', '/heritages').send({ name: ' Di sản ', slug: ` ${prefix.toUpperCase()} `, nameEn: 'Heritage', highlights: ['Điểm nổi bật'], mapX: 12.5 });
    if (res.body.data?.id) heritageIds.push(res.body.data.id);
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ name: 'Di sản', slug: prefix, nameEn: 'Heritage', status: 'draft', highlights: ['Điểm nổi bật'] });
  });
  it('rejects duplicate slug', async () => {
    const res = await api('post', '/heritages').send({ name: 'Duplicate', slug: heritage.slug });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });
  it.each([{ name: 'Missing slug' }, { name: 'Bad slug', slug: 'bad/slug' }, { name: '', slug: 'empty-name' }, { name: 'Bad status', slug: 'bad-status', status: 'new' }, { name: 'Bad coordinate', slug: 'bad-coordinate', mapX: 10000 }])('rejects invalid creation %j', async body => {
    expect((await api('post', '/heritages').send(body)).status).toBe(400);
  });
  it('updates content while accepting an unchanged slug', async () => {
    const res = await api('put', `/heritages/${heritage.id}`).send({ slug: heritage.slug, story: 'Updated story', storyEn: 'English story', highlightsEn: ['Highlight'] });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ story: 'Updated story', slug: heritage.slug, highlightsEn: ['Highlight'] });
  });
  it('rejects changing slug without changing other content', async () => {
    const res = await api('put', `/heritages/${heritage.id}`).send({ slug: 'changed', name: 'Must not save' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('SLUG_IMMUTABLE');
    expect((await prisma.heritage.findUnique({ where: { id: heritage.id } })).name).toBe(prefix);
  });
  it('generates one configured QR even for concurrent requests and reuses it', async () => {
    const responses = await Promise.all(Array.from({ length: 5 }, () => api('get', `/heritages/${heritage.id}/qr`)));
    for (const res of responses) {
      expect(res.status).toBe(200);
      expect(res.body.data.publicUrl).toBe(`https://heritage.example.test/site/heritage/${heritage.slug}`);
      expect(res.body.data.qrData).toBe(res.body.data.publicUrl);
    }
    expect(new Set(responses.map(res => res.body.data.id)).size).toBe(1);
    expect(await prisma.heritageQrCode.count({ where: { heritageId: heritage.id } })).toBe(1);
    const again = await api('get', `/heritages/${heritage.id}/qr`);
    expect(again.body.data).toEqual(responses[0].body.data);
    await api('put', `/heritages/${heritage.id}`).send({ story: 'Content edited after printing QR' });
    expect((await api('get', `/heritages/${heritage.id}/qr`)).body.data).toEqual(again.body.data);
  }, 20000);
  it('reuses a legacy QR row and normalizes its destination', async () => {
    const row = await prisma.heritageQrCode.create({ data: { heritageId: other.id, qrData: 'https://old.example/heritages/old' } });
    const res = await api('get', `/heritages/${other.id}/qr`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(row.id);
    expect(res.body.data.publicUrl).toBe(`https://heritage.example.test/site/heritage/${other.slug}`);
    expect(await prisma.heritageQrCode.count({ where: { heritageId: other.id } })).toBe(1);
  });
  it('does not expose feedback or internal notes publicly', async () => {
    const res = await request(app).get(`/api/public/heritages/${heritage.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.data).not.toHaveProperty('feedbacks');
    expect(JSON.stringify(res.body)).not.toContain('Private note');
    expect(JSON.stringify(res.body)).not.toContain('private@example.test');
    expect(await prisma.feedback.count({ where: { heritageId: heritage.id } })).toBe(2);
  });
  it('does not expose drafts publicly', async () => {
    expect((await request(app).get(`/api/public/heritages/${other.slug}`)).status).toBe(404);
  });
  it('soft deletes and excludes the record from admin/public list, detail, updates and QR', async () => {
    const row = await createHeritage();
    const res = await api('delete', `/heritages/${row.id}`);
    expect(res.status).toBe(200);
    const deleted = await prisma.heritage.findUnique({ where: { id: row.id } });
    expect(deleted).toMatchObject({ isDeleted: true, deletedBy: admin.id });
    expect(deleted.deletedAt).toBeInstanceOf(Date);
    for (const suffix of ['', '/qr']) expect((await api('get', `/heritages/${row.id}${suffix}`)).status).toBe(404);
    expect((await api('put', `/heritages/${row.id}`).send({ name: 'Changed' })).status).toBe(404);
    expect((await api('delete', `/heritages/${row.id}`)).status).toBe(404);
    expect((await request(app).get(`/api/public/heritages/${row.slug}`)).status).toBe(404);
    expect((await api('get', '/heritages').query({ search: row.slug })).body.data).toEqual([]);
    expect((await request(app).get('/api/public/heritages')).body.data.some(item => item.id === row.id)).toBe(false);
    expect((await api('post', '/heritages').send({ name: 'Reuse deleted slug', slug: row.slug })).status).toBe(409);
  });
  it('returns 404 for unknown heritage and QR', async () => {
    for (const suffix of ['', '/qr']) expect((await api('get', `/heritages/${randomUUID()}${suffix}`)).status).toBe(404);
  });
});

describe('Admin Feedback', () => {
  it('lists feedback', async () => {
    const res = await api('get', '/feedbacks');
    expect(res.status).toBe(200);
    expect(res.body.meta.limit).toBe(20);
  });
  it.each(['heritageId', 'rating', 'status'])('filters by %s', async field => {
    const value = { heritageId: heritage.id, rating: 2, status: 'new' }[field];
    const res = await api('get', '/feedbacks').query({ [field]: value, limit: 100 });
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every(row => row[field] === value)).toBe(true);
  });
  it('combines filters with AND', async () => {
    const res = await api('get', '/feedbacks').query({ heritageId: heritage.id, rating: 2, status: 'new' });
    expect(res.status).toBe(200);
    expect(res.body.data.map(row => row.id)).toEqual([feedbacks[0].id]);
  });
  it('orders newest first and paginates', async () => {
    const res = await api('get', '/feedbacks').query({ heritageId: heritage.id });
    expect(res.body.data.map(row => row.id)).toEqual([feedbacks[1].id, feedbacks[0].id]);
    const page = await api('get', '/feedbacks').query({ heritageId: heritage.id, page: 2, limit: 1 });
    expect(page.body.data.map(row => row.id)).toEqual([feedbacks[0].id]);
    expect(page.body.meta).toMatchObject({ total: 2, totalPages: 2, page: 2 });
  });
  it('returns complete detail and basic heritage', async () => {
    const res = await api('get', `/feedbacks/${feedbacks[0].id}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ internalNote: 'Private note', contactEmail: 'private@example.test', heritage: { id: heritage.id, name: prefix, slug: heritage.slug } });
    expect(res.body.data.heritage).not.toHaveProperty('story');
  });
  it.each(['in_progress', 'responded', 'closed'])('updates status to %s', async status => {
    const res = await api('patch', `/feedbacks/${feedbacks[0].id}/status`).send({ status });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status, internalNote: 'Private note' });
  });
  it('updates optional internal note', async () => {
    const res = await api('patch', `/feedbacks/${feedbacks[0].id}/status`).send({ status: 'closed', internalNote: 'Handled' });
    expect(res.status).toBe(200);
    expect(res.body.data.internalNote).toBe('Handled');
  });
  it('rejects invalid status', async () => {
    const res = await api('patch', `/feedbacks/${feedbacks[0].id}/status`).send({ status: 'published' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
  it('returns 404 for unknown detail and update', async () => {
    expect((await api('get', `/feedbacks/${randomUUID()}`)).status).toBe(404);
    expect((await api('patch', `/feedbacks/${randomUUID()}/status`).send({ status: 'closed' })).status).toBe(404);
  });
  it.each([{ rating: 0 }, { rating: 6 }, { rating: 2.5 }, { status: 'invalid' }, { heritageId: 'invalid' }, { page: 0 }, { page: 'abc' }, { limit: 101 }, { page: 1e20 }])('rejects invalid query %j', async query => {
    expect((await api('get', '/feedbacks').query(query)).status).toBe(400);
  });
});

describe('Admin authorization', () => {
  const id = randomUUID();
  it.each([
    ['get', '/heritages'], ['post', '/heritages'], ['get', `/heritages/${id}`],
    ['put', `/heritages/${id}`], ['delete', `/heritages/${id}`], ['get', `/heritages/${id}/qr`],
    ['get', '/feedbacks'], ['get', `/feedbacks/${id}`], ['patch', `/feedbacks/${id}/status`],
  ])('protects %s %s', async (method, path) => {
    expect((await request(app)[method](`/api/admin${path}`)).status).toBe(401);
    expect((await request(app)[method](`/api/admin${path}`).set('Authorization', `Bearer ${partnerToken}`)).status).toBe(403);
  });
});

describe('Heritage/Feedback OpenAPI', () => {
  it('documents all operations, validation, pagination and QR response', async () => {
    const res = await request(app).get('/api/openapi.json');
    expect(res.status).toBe(200);
    const document = res.body;
    for (const [path, methods] of Object.entries({
      '/admin/heritages': ['get', 'post'], '/admin/heritages/{id}': ['get', 'put', 'delete'],
      '/admin/heritages/{id}/qr': ['get'], '/admin/feedbacks': ['get'],
      '/admin/feedbacks/{id}': ['get'], '/admin/feedbacks/{id}/status': ['patch'],
    })) {
      for (const method of methods) {
        expect(document.paths[path][method].security).toEqual([{ BearerAuth: [] }]);
        expect(document.paths[path][method].responses).toHaveProperty('400');
      }
    }
    expect(document.components.schemas.FeedbackStatusUpdate.properties.status.enum).toEqual(['new', 'in_progress', 'responded', 'closed']);
    expect(document.paths['/admin/heritages/{id}'].put.description).toContain('SLUG_IMMUTABLE');
    expect(document.paths['/admin/feedbacks'].get.parameters.map(item => item.name)).toEqual(['page', 'limit', 'heritageId', 'rating', 'status']);
    expect(document.components.schemas.HeritageQr.properties).toHaveProperty('publicUrl');
  });
});
