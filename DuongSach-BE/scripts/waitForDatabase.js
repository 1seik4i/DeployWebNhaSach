import { PrismaClient } from '@prisma/client';
import { setTimeout as delay } from 'node:timers/promises';

// Retry connectivity only, before any schema or seed changes are attempted.
export async function waitForDatabase({ createClient = () => new PrismaClient(), sleep = delay, attempts = 10 } = {}) {
  const rawUrl = process.env.DATABASE_URL;
  let url;
  try {
    url = new URL(rawUrl);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname) throw new Error();
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL. Set it in Render > backend > Environment.');
  }

  // Log the host only: never print credentials or the full connection URL.
  const target = `${url.hostname}:${url.port || '5432'}`;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const prisma = createClient();
    try {
      await prisma.$connect();
      console.log(`PostgreSQL is ready at ${target}.`);
      return;
    } catch (error) {
      if (!['P1001', 'P1002', 'P1017'].includes(error.errorCode || error.code)) throw error;
      if (attempt === attempts) {
        throw new Error(
          `Cannot connect to PostgreSQL at ${target} after ${attempts} attempts. `
          + 'In Render, check that the database is Available and DATABASE_URL matches its current connection URL. '
          + 'An Internal Database URL requires the backend and database to be in the same region and workspace. '
          + 'Otherwise use the External Database URL with sslmode=require and verify external access rules.',
        );
      }
      console.warn(`PostgreSQL unavailable (${attempt}/${attempts}); retrying in 5 seconds...`);
    } finally {
      await prisma.$disconnect();
    }
    await sleep(5000);
  }
}
