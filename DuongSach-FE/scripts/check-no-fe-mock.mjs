import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const roots = ['src', 'tests'];
const forbidden = [
  'VITE_USE_MOCK_API',
  'mock-token',
  'mockSessionStore',
  'mockEventImages',
  'demo-login',
  'SAMPLE_TARGETS',
  'defaultSettings',
  'Math.random(',
];
const violations = [];

async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await scan(path);
    else if (['.ts', '.tsx'].includes(extname(entry.name))) {
      const source = await readFile(path, 'utf8');
      for (const token of forbidden) {
        if (source.includes(token)) violations.push(`${relative(root, path)}: ${token}`);
      }
    }
  }
}

for (const directory of roots) await scan(join(root, directory));
if (violations.length) {
  console.error(`Phát hiện cơ chế dữ liệu giả ở frontend:\n${violations.join('\n')}`);
  process.exit(1);
}
console.log('Không phát hiện token mock/fallback bị cấm trong frontend.');
