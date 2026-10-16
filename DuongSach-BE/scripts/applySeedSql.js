import { readdir, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import 'dotenv/config';

const require = createRequire(import.meta.url);
const directory = new URL('../database/seed/', import.meta.url);
const files = (await readdir(directory)).filter(name => name.endsWith('.sql')).sort();
if (!files.length) throw new Error('No database seed SQL files found.');
const sources = await Promise.all(files.map(name => readFile(new URL(name, directory), 'utf8')));
console.log(`Loading ${files.length} seed SQL files in one transaction...`);
// Pass complete SQL to Prisma rather than splitting on semicolons inside strings.
// A failed file rolls back all seed data so the next startup can safely retry.
execFileSync(process.execPath, [require.resolve('prisma/build/index.js'), 'db', 'execute', '--schema', 'prisma/schema.prisma', '--stdin'], {
  cwd: new URL('../', import.meta.url),
  input: `BEGIN;\n${sources.join('\n')}\nCOMMIT;`,
  stdio: ['pipe', 'inherit', 'inherit'],
});
console.log('Seed SQL committed successfully.');
