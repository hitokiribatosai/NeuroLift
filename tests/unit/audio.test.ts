import { expect, test, vi } from 'vitest';
import { readFileSync } from 'node:fs';
test('native alert contains exactly three separated tones on both platforms', () => {
  const android = readFileSync('android/app/src/main/res/raw/neurolift_rest_beeps.wav');
  expect(readFileSync('ios/App/App/neurolift_rest_beeps.wav')).toEqual(android);
  expect(android.toString('ascii', 0, 4)).toBe('RIFF');
  const rate = android.readUInt32LE(24);
  let tones = 0, audible = false;
  // Inspect 10 ms blocks to avoid mistaking sine zero-crossings for gaps.
  for (let offset = 44; offset < android.length; offset += Math.round(rate / 100) * 2) {
    let peak = 0;
    for (let n = offset; n < Math.min(offset + Math.round(rate / 100) * 2, android.length); n += 2) peak = Math.max(peak, Math.abs(android.readInt16LE(n)));
    const next = peak > 100;
    if (next && !audible) tones++;
    audible = next;
  }
  expect(tones).toBe(3);
});
test('foreground completion schedules three short separated beeps', async () => {
  vi.resetModules();
  const starts: number[] = [], stops: number[] = [];
  const param = () => ({ setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() });
  class FakeAudio {
    currentTime = 1; state = 'running'; destination = {};
    resume = vi.fn(async () => {});
    createOscillator = () => ({ frequency: param(), connect: vi.fn(), disconnect: vi.fn(), start: (at: number) => starts.push(at), stop: (at: number) => stops.push(at) });
    createGain = () => ({ gain: param(), connect: vi.fn(), disconnect: vi.fn() });
  }
  vi.stubGlobal('window', { AudioContext: FakeAudio });
  vi.stubGlobal('document', { visibilityState: 'visible' });
  try {
    const { playNotificationSound } = await import('../../utils/audio');
    await playNotificationSound();
    expect(starts).toHaveLength(3);
    expect(starts[1] - starts[0]).toBeCloseTo(0.35);
    expect(starts[2] - starts[1]).toBeCloseTo(0.35);
    stops.forEach((end, i) => expect(end - starts[i]).toBeCloseTo(0.2));
  } finally { vi.unstubAllGlobals(); }
});
