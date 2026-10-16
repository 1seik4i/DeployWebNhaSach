import { spawn } from 'node:child_process';

// Windows terminals can inherit a legacy code page, which renders Vietnamese
// API messages as mojibake. Switch only the development shell to UTF-8 before
// starting Node; other platforms already use UTF-8 by default.
const isWindows = process.platform === 'win32';
const command = isWindows ? 'cmd.exe' : process.execPath;
const args = isWindows
  ? ['/d', '/c', 'chcp 65001 > nul && node --watch src/server.js']
  : ['--watch', 'src/server.js'];

const child = spawn(command, args, { stdio: 'inherit' });

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error('Không thể khởi động backend:', error.message);
  process.exit(1);
});
