import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';

// Existing local databases may predate the profile department field.
// Apply only this additive, versioned change; never reset or reseed data.
export async function ensureUserDepartment() {
  const db = new PrismaClient();
  try {
    const columns = await db.$queryRaw`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = 'users'
        AND column_name = 'department'
    `;
    if (columns.length) return;
    const sql = await readFile(new URL('../prisma/migrations/20261019000000_user_department/migration.sql', import.meta.url), 'utf8');
    await db.$executeRawUnsafe(sql);
    console.log('Database updated: users.department is ready.');
  } finally {
    await db.$disconnect();
  }
}

if (process.argv[1]?.endsWith('ensureUserDepartment.js')) {
  ensureUserDepartment().catch(error => {
    console.error('Cannot update profile database schema:', error.message);
    process.exitCode = 1;
  });
}
