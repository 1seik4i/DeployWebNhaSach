import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

export async function ensureLandingContent() {
  const prisma = new PrismaClient();
  try {
    const raw = fs.readFileSync(new URL('../database/seed/landing-content-data.json', import.meta.url), 'utf8');
    const items = JSON.parse(raw);

    // Delete obsolete legacy standalone news slugs
    await prisma.contentEntry.deleteMany({
      where: {
        slug: {
          in: [
            'khai-mac-le-hoi-duong-sach-mua-thu-2026',
            'toa-dam-10-nam-duong-sach-tphcm',
            'workshop-dong-sach-thu-cong-gay-sot'
          ]
        }
      }
    }).catch(() => undefined);

    for (const item of items) {
      const existing = await prisma.contentEntry.findUnique({
        where: { slug: item.slug }
      });

      // Check if existing content is empty or needs baseline enrichment
      let needsUpdate = false;
      if (!existing) {
        needsUpdate = true;
      } else {
        const data = existing.data || {};
        if (item.slug === 'landing-news' && (!Array.isArray(data.articles) || data.articles.length === 0)) {
          needsUpdate = true;
        } else if (item.slug === 'landing-journey' && (!Array.isArray(data.milestones) || data.milestones.length === 0)) {
          needsUpdate = true;
        } else if (item.slug === 'landing-org' && (!Array.isArray(data.leaders) || data.leaders.length < 4)) {
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await prisma.contentEntry.upsert({
          where: { slug: item.slug },
          create: {
            id: item.id,
            slug: item.slug,
            kind: item.kind,
            title: item.title,
            data: item.data,
            status: 'published',
            version: 1
          },
          update: {
            title: item.title,
            data: item.data,
            status: 'published',
            updatedAt: new Date()
          }
        });
        console.log(`[ensureLandingContent] Seeded/updated ${item.slug} (${item.kind})`);
      } else {
        console.log(`[ensureLandingContent] Content ${item.slug} already populated.`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1]?.endsWith('ensureLandingContent.js')) {
  ensureLandingContent().catch((error) => {
    console.error('Failed to ensure landing content:', error);
    process.exit(1);
  });
}
