import { expect, test } from 'vitest';
import { interfaceCopy, translateInterface } from '../../utils/interfaceCopy';
import { isTrackerPhase } from '../../utils/sessionDraft';

test('all interface messages have matching localized placeholders', () => {
  for (const message of Object.values(interfaceCopy)) {
    const placeholders = (s: string) => [...new Set(s.match(/\{\d+\}/g) || [])].sort();
    expect(message.fr.length).toBeGreaterThan(0);
    expect(message.ar.length).toBeGreaterThan(0);
    expect(placeholders(message.fr)).toEqual(placeholders(message.en));
    expect(placeholders(message.ar)).toEqual(placeholders(message.en));
  }
});

test('interface copy selects language without changing the message', () => {
  expect(translateInterface('fr', 'review')).toBe('Vérifier');
  expect(translateInterface('ar', 'review')).toBe('مراجعة');
  expect(translateInterface('en', 'review')).toBe('Review');
});

test('persisted phases are narrowed instead of trusted by a cast', () => {
  for (const phase of ['setup', 'selection', 'active', 'summary']) expect(isTrackerPhase(phase)).toBe(true);
  for (const phase of [null, undefined, {}, 'finished']) expect(isTrackerPhase(phase)).toBe(false);
});
