import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

test('shared theme styling uses explicit roles, not utility-name substring matching', () => {
  const css = readFileSync('components/web/website.css', 'utf8');
  expect(css).not.toMatch(/\[class\*=/);
  for (const role of ['paper', 'canvas', 'border', 'ink', 'muted', 'green', 'accent', 'flat', 'rounded']) {
    expect(css).toContain(`.surface-${role}`);
  }
});
