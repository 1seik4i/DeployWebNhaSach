import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

const app = createApp();

describe('Limited API contract', () => {
  it('serves the health endpoint', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('healthy');
  });

  it.each(['/api/public/booths', '/api/public/events', '/api/public/activities', '/api/public/heritages', '/api/public/map-hotspots'])(
    'returns a database-backed array from %s', async path => {
      const response = await request(app).get(path);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    },
  );

  it.each(['/api/admin/booths', '/api/admin/venues', '/api/admin/assets'])(
    'protects %s', async path => {
      const response = await request(app).get(path);
      expect(response.status).toBe(401);
    },
  );

  it('provides quick sign-in for the two supported database-backed roles', async () => {
    const response = await request(app).get('/api/auth/demo-accounts');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    const roles = ['partner', 'admin'];
    expect(response.body.data.map(account => account.role).sort()).toEqual(roles.sort());
    for (const role of roles) {
      const login = await request(app).post('/api/auth/demo-login').send({ role });
      expect(login.status).toBe(200);
      expect(login.body.data.user.primaryRole).toBe(role);
      expect(login.body.data.accessToken).toEqual(expect.any(String));
    }
  });

  it('allows the admin account to use the new facility CRUD lists', async () => {
    const login = await request(app).post('/api/auth/demo-login').send({ role: 'admin' });
    const token = login.body.data.accessToken;
    for (const path of ['/api/admin/booths', '/api/admin/venues', '/api/admin/assets']) {
      const response = await request(app).get(path).set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    }
  });

  it('blocks partner access to admin facilities', async () => {
    const login = await request(app).post('/api/auth/demo-login').send({ role: 'partner' });
    const token = login.body.data.accessToken;
    for (const path of ['/api/admin/venues', '/api/admin/assets']) {
      const response = await request(app).get(path).set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(403);
    }
    const booths = await request(app).get('/api/admin/booths').set('Authorization', `Bearer ${token}`);
    expect(booths.status).toBe(403);
  });

  it('provides role-specific personal profiles and admin access control data', async () => {
    for (const role of ['partner', 'admin']) {
      const login = await request(app).post('/api/auth/demo-login').send({ role });
      const response = await request(app).get(`/api/${role}/profile`).set('Authorization', `Bearer ${login.body.data.accessToken}`);
      expect(response.status).toBe(200);
      expect(response.body.data.primaryRole).toBe(role);
    }
    const adminLogin = await request(app).post('/api/auth/demo-login').send({ role: 'admin' });
    const token = adminLogin.body.data.accessToken;
    for (const path of ['/api/admin/roles', '/api/admin/permissions']) {
      const response = await request(app).get(path).set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    }
  });

  it.each(['/api/auth/register', '/api/public/feedbacks'])(
    'does not expose unrelated endpoint %s', async path => {
      const response = await request(app).get(path);
      expect(response.status).toBe(501);
      expect(response.body.error.code).toBe('NOT_IMPLEMENTED');
    },
  );

  it('publishes documentation only for the retained API surface', async () => {
    const response = await request(app).get('/api/openapi.json');
    expect(response.status).toBe(200);
    expect(response.body.paths['/admin/booths']).toBeDefined();
    expect(response.body.paths['/public/map-hotspots']).toBeDefined();
    expect(response.body.paths['/admin/users']).toBeDefined();
    expect(response.body.paths['/participant/activities']).toBeUndefined();
    expect(response.body.paths['/participant/profile']).toBeUndefined();
    expect(response.body.paths['/partner/profile'].get.tags).toEqual(['Đối tác - Hồ sơ cá nhân']);
    expect(response.body.paths['/organizer/profile']).toBeUndefined();
    expect(response.body.paths['/admin/booths'].get.tags).toEqual(['Quản trị viên - CRUD gian hàng']);

    const docs = await request(app).get('/api/docs/');
    expect(docs.status).toBe(200);
    expect(docs.text).toContain('swagger');
  });
});
