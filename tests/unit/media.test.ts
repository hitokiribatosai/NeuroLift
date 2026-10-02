// @vitest-environment node
import { expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import media from '../../utils/exerciseMedia.json';
test('every bundled demonstration matches its pinned checksum', () => {
 const source = readFileSync('utils/exerciseData.ts','utf8');
 const catalog = source.slice(source.indexOf('const db:'), source.indexOf('export const getExerciseDatabase'));
 const names = new Set([...catalog.matchAll(/\{ en: "([^"]+)"/g)].map(match => match[1]));
 expect(names.size).toBe(231);
 expect(Object.keys(media)).toHaveLength(168);
 for (const [name, demo] of Object.entries(media)) {
  expect(names.has(name)).toBe(true);
  expect(demo.images).toHaveLength(2);
  demo.images.forEach((path,i) => {
   expect(createHash('sha256').update(readFileSync('public'+path)).digest('hex')).toBe(demo.hashes[i]);
  });
 }
 expect(media['Incline Dumbbell Press'].sourceId).toBe('Incline_Dumbbell_Press');
 expect(media['Nordic Curls'].sourceId).toBe('nordic-hamstring-curl');
 expect(media['Burpees'].source).toBe('workout-guide');
 expect(readFileSync('public/exercises/LICENSE.txt','utf8')).toContain('https://unlicense.org');
 expect(readFileSync('public/exercises/workout-guide/LICENSE-ASSETS','utf8')).toContain('CC BY-SA 4.0');
});
