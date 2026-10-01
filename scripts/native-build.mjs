import { spawnSync } from 'node:child_process';
import { writeFile, readFile } from 'node:fs/promises';
import { loadEnv } from 'vite';
const [platform, mode = 'release'] = process.argv.slice(2);
if (!['android','ios'].includes(platform) || !['debug','release'].includes(mode)) throw new Error('Use native-build.mjs android|ios debug|release');
const env = { ...process.env, ...loadEnv('production', process.cwd(), ''), ...process.env };
const debug = mode === 'debug';
env.NEUROLIFT_NATIVE_DEBUG = String(debug);
let api = env.VITE_API_URL;
if (debug && (!api || api.startsWith('/'))) api = platform === 'android' ? 'http://10.0.2.2:8000/api' : 'http://localhost:8000/api';
if (!api || !/^https?:\/\//.test(api)) throw new Error('Native builds require an absolute VITE_API_URL.');
const url = new URL(api);
if (!debug && (url.protocol !== 'https:' || ['localhost','127.0.0.1','10.0.2.2'].includes(url.hostname))) throw new Error('Release builds require a public HTTPS API.');
env.VITE_API_URL = api;
function run(args) {
 const r = spawnSync(process.execPath, args, { stdio:'inherit', env });
 if (r.status !== 0) process.exit(r.status || 1);
}
run(['node_modules/vite/bin/vite.js','build']);
await writeFile('dist/native-build.json', JSON.stringify({platform,mode,api}, null,2));
run(['scripts/build-sw.mjs']);
run(['node_modules/@capacitor/cli/bin/capacitor','sync',platform]);
if (platform === 'ios') {
 const path = 'ios/App/CapApp-SPM/Package.swift';
 const source = await readFile(path,'utf8');
 await writeFile(path, source.replace(/path: "([^"]+)"/g, (_,p) => 'path: "' + p.replace(/\\+/g,'/') + '"'));
}
console.log('Native assets prepared for ' + platform + ' (' + mode + '). Compile using Xcode or Android Studio.');
