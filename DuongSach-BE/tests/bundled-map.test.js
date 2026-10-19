import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('@prisma/client', () => {
  const db = { setting: { findUnique: vi.fn(), upsert: vi.fn() }, $disconnect: vi.fn() };
  db.$transaction = vi.fn(fn => fn(db));
  return { PrismaClient: vi.fn(function () { return db; }) };
});
import { PrismaClient } from '@prisma/client';
import { installBundledMap, BUNDLED_MAP_IMAGE } from '../scripts/installBundledMap.js';
const db = new PrismaClient();
beforeEach(() => vi.clearAllMocks());
it('activates the bundled image without discarding map settings', async () => {
  db.setting.findUnique.mockResolvedValue({ value: { venueId: 'venue', imageUrl: 'data:image/png;base64,old' } });
  await installBundledMap();
  expect(db.setting.upsert.mock.calls[0][0].update.value).toEqual({ venueId: 'venue', imageUrl: BUNDLED_MAP_IMAGE, bundledMapRevision: '20261019-gemini-map' });
});
it('keeps later admin uploads on subsequent deployments', async () => {
  db.setting.findUnique.mockResolvedValue({ value: { imageUrl: '/later-upload.png', bundledMapRevision: '20261019-gemini-map' } });
  await installBundledMap();
  expect(db.setting.upsert).not.toHaveBeenCalled();
});
