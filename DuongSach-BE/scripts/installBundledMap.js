import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

export const BUNDLED_MAP_IMAGE = '/assets/maps/duong-sach-map-20261019.png';
const revision = '20261019-gemini-map';

// Activate the requested bundled map once, preserving coordinates and metadata.
// Later admin uploads keep this revision and survive subsequent deployments.
export async function installBundledMap() {
  const db = new PrismaClient();
  try {
    await db.$transaction(async tx => {
      const previous = await tx.setting.findUnique({ where: { key: 'public.map' } });
      if (previous?.value?.bundledMapRevision === revision) return;
      const value = { ...previous?.value, imageUrl: BUNDLED_MAP_IMAGE, bundledMapRevision: revision };
      await tx.setting.upsert({ where: { key: 'public.map' }, create: { key: 'public.map', value }, update: { value } });
    });
  } finally {
    await db.$disconnect();
  }
}

if (process.argv[1]?.endsWith('installBundledMap.js')) {
  installBundledMap().catch(error => { console.error(error.message); process.exitCode = 1; });
}
