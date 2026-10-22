import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 5173;

function portFree(target) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen(target, '127.0.0.1');
  });
}

function waitForPort(target) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const attempt = () => {
      const socket = net.createConnection({ port: target, host: '127.0.0.1' });
      socket.once('connect', () => {
        socket.end();
        resolve();
      });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() - started > 20000) {
          reject(new Error('开发服务没有在 20 秒内打开'));
          return;
        }
        setTimeout(attempt, 200);
      });
    };
    attempt();
  });
}

if (!(await portFree(port))) {
  console.error(`端口 ${port} 已经被占用。先关掉另一个 npm run dev 或 npm run desktop，再打开。`);
  process.exit(1);
}

const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const electronBin = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'electron.cmd' : 'electron');

const vite = spawn(process.execPath, [viteBin, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  cwd: root,
  stdio: 'inherit',
});

let electron;
let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (electron && !electron.killed) electron.kill();
  if (!vite.killed) vite.kill();
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
vite.on('exit', (code) => {
  if (!shuttingDown) shutdown(code ?? 1);
});

try {
  await waitForPort(port);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  shutdown(1);
}

electron = spawn(electronBin, [], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, ELECTRON_START_URL: `http://127.0.0.1:${port}` },
});

electron.on('exit', (code) => shutdown(code ?? 0));
