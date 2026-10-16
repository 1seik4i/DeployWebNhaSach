import { spawnSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const npmCli = process.env.npm_execpath || (process.platform === 'win32'
  ? join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js')
  : realpathSync(join(dirname(process.execPath), 'npm')));

console.log(`Render backend build: ${root}`);
console.log(`Node ${process.version}; lockfile present: ${existsSync(join(root, 'package-lock.json'))}`);
// npm install also supports environments where the lockfile was not checked out.
// With the committed lockfile present, npm reuses its resolved dependencies.
for (const args of [
  ['install', '--omit=dev', '--no-audit', '--no-fund'],
  ['run', 'generate'],
]) {
  const result = spawnSync(process.execPath, [npmCli, ...args], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
