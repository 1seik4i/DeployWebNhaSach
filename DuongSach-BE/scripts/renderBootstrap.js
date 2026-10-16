import { execFileSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { applyApiCompletion } from './applyApiCompletion.js';

const command = (name) => (process.platform === 'win32' ? `${name}.cmd` : name);

function run(commandName, args) {
  execFileSync(command(commandName), args, { stdio: 'inherit' });
}

async function hasSeedData() {
  const prisma = new PrismaClient();
  try {
    const userTable = await prisma.$queryRaw`
      SELECT to_regclass('public.users')::text AS table_name
    `;

    if (!userTable[0]?.table_name) {
      throw new Error('Schema PostgreSQL chưa được tạo sau prisma db push.');
    }

    return (await prisma.user.count()) > 0;
  } finally {
    await prisma.$disconnect();
  }
}

export async function bootstrapDatabase() {
  console.log('Preparing PostgreSQL schema for Render...');
  run('npx', ['prisma', 'generate']);
  run('npx', ['prisma', 'db', 'push']);

  if (await hasSeedData()) {
    await applyApiCompletion();
    console.log('Database already contains data; demo seed is skipped.');
    return;
  }

  console.log('Database is empty; loading demo data once...');
  run('npm', ['run', 'seed']);
  await applyApiCompletion();
}

if (process.argv[1]?.endsWith('renderBootstrap.js')) {
  bootstrapDatabase().catch((error) => {
    console.error('Render database bootstrap failed:', error.message);
    process.exit(1);
  });
}
