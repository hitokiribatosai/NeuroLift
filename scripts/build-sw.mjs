import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
async function walk(dir) {
 const entries = await readdir(dir, {withFileTypes:true});
 const nested = await Promise.all(entries.map(e => e.isDirectory() ? walk(dir + '/' + e.name) : [dir + '/' + e.name]));
 return nested.flat();
}
const files = (await walk('dist')).filter(p => !p.endsWith('/sw.js') && !p.endsWith('.map')).sort();
const hash = createHash('sha256');
for (const file of files) hash.update(await readFile(file));
const template = await readFile('scripts/sw-template.js', 'utf8');
const output = template.replace('__BUILD__', hash.digest('hex').slice(0,16)).replace('const ASSETS = __ASSETS__;', 'const ASSETS = ' + JSON.stringify(files.map(p => p.slice(4))) + ';');
await writeFile('dist/sw.js', output);
console.log('Service worker precaches ' + files.length + ' built files, including local exercise demos.');
