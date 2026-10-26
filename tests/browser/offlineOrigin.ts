import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

/** Isolated built-app origin; failure does not disable WebKit service workers. */
export async function offlineOrigin() {
  let available = true;
  const root = resolve('dist');
  const mime: Record<string, string> = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
    '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
  const server = createServer(async (request, response) => {
    if (!available) { request.socket.destroy(); return; }
    const pathname = new URL(request.url || '/', 'http://localhost').pathname;
    const path = resolve(root, pathname === '/' ? 'index.html' : pathname.slice(1));
    if (!path.startsWith(root + sep)) { response.writeHead(404).end(); return; }
    try {
      const body = await readFile(path);
      response.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream' });
      response.end(body);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test origin did not start');
  return { url: `http://127.0.0.1:${address.port}`, disconnect: () => { available = false; },
    close: () => new Promise<void>((resolve, reject) => {
      server.closeAllConnections(); server.close(error => error ? reject(error) : resolve());
    }) };
}
