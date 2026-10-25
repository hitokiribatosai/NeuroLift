import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, expect, test, vi } from 'vitest';
import { usePersistenceAction } from '../../hooks/usePersistenceAction';
import { safeStorage } from '../../utils/storage';
import { changeScope, readWorkspace } from '../../utils/workspace';

beforeEach(() => {
  localStorage.clear(); changeScope('guest');
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

test('explicit actions wait for durability, ignore double taps and keep UI on failure', async () => {
  let run: ReturnType<typeof usePersistenceAction>;
  function Probe() { run = usePersistenceAction(); return null; }
  const root = createRoot(document.createElement('div'));
  await act(async () => root.render(<Probe />));
  let resolve!: () => void;
  const durable = new Promise<void>(done => { resolve = done; });
  const closeDialog = vi.fn();
  const duplicate = vi.fn();
  const onError = vi.fn();
  window.addEventListener('storage-error', onError);
  try {
    const first = run!(async () => { await durable; closeDialog(); });
    await run!(duplicate);
    expect(closeDialog).not.toHaveBeenCalled();
    expect(duplicate).not.toHaveBeenCalled();
    resolve(); await first;
    expect(closeDialog).toHaveBeenCalledTimes(1);
    await run!(async () => { throw new Error('disk full'); });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(closeDialog).toHaveBeenCalledTimes(1);
  } finally { window.removeEventListener('storage-error', onError); act(() => root.unmount()); }
});

test('related keys are saved once and template deletion clears its schedule atomically', async () => {
  await safeStorage.setItems({ neuroLift_templates: JSON.stringify([{ id: 'a' }, { id: 'b' }]),
    neuroLift_weekly_schedule: JSON.stringify({ '0': 'a', '1': 'b' }) });
  const write = vi.spyOn(Storage.prototype, 'setItem');
  await safeStorage.deleteTemplate('a');
  expect(write).toHaveBeenCalledTimes(1);
  expect(safeStorage.getParsed('neuroLift_templates', [])).toEqual([{ id: 'b' }]);
  expect(safeStorage.getParsed('neuroLift_weekly_schedule', {})).toEqual({ '1': 'b' });
  write.mockRestore();
});

test('failed multi-key write preserves every previous value', async () => {
  await safeStorage.setItems({ neuroLift_cal_date: 'yesterday', neuroLift_daily_cal: '500' });
  const before = readWorkspace();
  const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  try {
    expect(() => safeStorage.setItems({ neuroLift_cal_date: 'today', neuroLift_daily_cal: '0' })).toThrow();
    expect(readWorkspace()).toEqual(before);
  } finally { write.mockRestore(); }
});
