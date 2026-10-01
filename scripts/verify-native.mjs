import { readFile } from 'node:fs/promises';
const platform = process.argv[2];
if (!['android','ios'].includes(platform)) throw new Error('Specify android or ios.');
const root = platform === 'android' ? 'android/app/src/main/assets/' : 'ios/App/App/';
const config = JSON.parse(await readFile(root + 'capacitor.config.json','utf8'));
const build = JSON.parse(await readFile(root + 'public/native-build.json','utf8'));
if (build.platform !== platform || build.mode !== 'release' || !build.api.startsWith('https://')) throw new Error('Prepare release assets with npm run ' + platform + ':build before archiving.');
if (config.server?.url || config.server?.cleartext || config.android?.allowMixedContent || config.android?.webContentsDebuggingEnabled || config.ios?.webContentsDebuggingEnabled) throw new Error('Development WebView settings cannot be released.');
console.log(platform + ' release asset checks passed.');
