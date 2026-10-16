import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcrypt';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.join(root, 'database/snapshot/current.sql');
const temporary = `${destination}.tmp`;
const options = { cwd: root, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 };
function database(command, args) {
  return execFileSync('docker', [
    'compose', 'exec', '-T', 'postgres', 'sh', '-c',
    'export PGPASSWORD="$POSTGRES_PASSWORD"; exec "$@" -U "$POSTGRES_USER" -d "$POSTGRES_DB"',
    'snapshot', command, ...args,
  ], options);
}

try {
  // Source password hashes never enter the dump. Authentication token rows are omitted.
  const dump = database('pg_dump', [
    '--format=plain', '--no-owner', '--no-privileges',
    '--exclude-table-data=public.users',
    '--exclude-table-data=public.refresh_tokens',
    '--exclude-table-data=public.password_resets',
  ]);
  const columns = database('psql', ['-X', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-c',
    "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' ORDER BY ordinal_position",
  ]).trim().split(/\r?\n/);
  if (!columns.includes('password_hash')) throw new Error('users.password_hash not found.');
  const hash = await bcrypt.hash('123456', 10);
  const quote = (column) => `"${column.replaceAll('"', '""')}"`;
  const select = columns.map((column) => column === 'password_hash'
    ? `'${hash}' AS password_hash` : quote(column)).join(', ');
  const users = database('psql', ['-X', '-q', '-v', 'ON_ERROR_STOP=1', '-c',
    `COPY (SELECT ${select} FROM public.users ORDER BY id) TO STDOUT`,
  ]);
  // pg_dump puts all table definitions before COPY data and all FKs afterwards.
  const insertion = dump.search(/^COPY /m);
  if (insertion < 0) throw new Error('No COPY section found in dump.');
  const userCopy = `COPY public.users (${columns.map(quote).join(', ')}) FROM stdin;\n${users}\\.\n\n`;
  let snapshot = dump.slice(0, insertion) + userCopy + dump.slice(insertion);
  // Also replace bcrypt hashes embedded in historical JSON/audit records.
  snapshot = snapshot.replace(/\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}/g, hash);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(temporary, snapshot, 'utf8');
  fs.renameSync(temporary, destination);
  console.log('Exported schema + business data; test password: 123456; login/reset token tables empty.');
} catch (error) {
  fs.rmSync(temporary, { force: true });
  console.error('Snapshot export failed; previous snapshot preserved:', error.message);
  process.exitCode = 1;
}
