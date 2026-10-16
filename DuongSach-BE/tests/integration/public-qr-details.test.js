import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { prisma } from '../../src/config/database.js';
import { createApp } from '../../src/app.js';
import { FacilityService } from '../../src/modules/facility/facility.service.js';
const app = createApp();
afterAll(() => prisma.$disconnect());
describe('public details for QR links', () => {
  for (const kind of ['booths', 'venues', 'locations']) {
    it(`returns public ${kind} details without private administration fields`, async () => {
      const list = await FacilityService.list(kind, {});
      expect(list.data.length).toBeGreaterThan(0);
      const row = list.data[0];
      const response = await request(app).get(`/api/public/${kind}/${row.id}`);
      expect(response.status, JSON.stringify(response.body)).toBe(200);
      expect(response.body.data).toMatchObject({ id: row.id, name: row.name });
      expect(response.body.data).not.toHaveProperty('requestId');
      expect(response.body.data).not.toHaveProperty('assignedOrgId');
      if (kind === 'booths') expect(response.body.data).not.toHaveProperty('capacity');
      expect((await request(app).get(`/api/public/${kind}/00000000-0000-4000-8000-000000000000`)).status).toBe(404);
    });
  }
});
