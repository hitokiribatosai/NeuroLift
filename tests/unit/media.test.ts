// @vitest-environment node
import { expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import media from '../../utils/exerciseMedia.json';
test('every bundled demonstration matches its pinned checksum', () => {
 expect(Object.keys(media)).toHaveLength(41);
 for (const demo of Object.values(media)) {
  expect(demo.images).toHaveLength(2);
  demo.images.forEach((path,i) => {
   expect(createHash('sha256').update(readFileSync('public'+path)).digest('hex')).toBe(demo.hashes[i]);
  });
 }
 expect(media['Incline Dumbbell Press'].sourceId).toBe('Incline_Dumbbell_Press');
 expect(readFileSync('public/exercises/LICENSE.txt','utf8')).toContain('https://unlicense.org');
});
