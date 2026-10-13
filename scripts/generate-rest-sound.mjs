// Original, deterministic PCM audio: three 880 Hz tones, no licensed samples.
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const rate = 44100, count = Math.round(rate * 1.1);
const wav = Buffer.alloc(44 + count * 2);
wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28);
wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
wav.write('data', 36); wav.writeUInt32LE(count * 2, 40);
for (let i = 0; i < count; i++) {
  const time = i / rate;
  const local = time - Math.floor(time / 0.35) * 0.35;
  const envelope = time < 0.9 && local < 0.2 ? Math.min(local / 0.02, (0.2 - local) / 0.02, 1) : 0;
  wav.writeInt16LE(Math.round(Math.sin(2 * Math.PI * 880 * local) * envelope * 12000), 44 + i * 2);
}
for (const relative of ['../android/app/src/main/res/raw/neurolift_rest_beeps.wav', '../ios/App/App/neurolift_rest_beeps.wav']) {
  const path = fileURLToPath(new URL(relative, import.meta.url));
  mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, wav);
}
