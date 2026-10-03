import { expect, test, vi } from 'vitest';
import { dismissTopOverlay, registerOverlay, isTopOverlay } from '../../utils/overlays';

test('Back dismisses only the topmost overlay and cleans up registrations', () => {
  const parent = vi.fn(), child = vi.fn();
  const removeParent = registerOverlay(parent);
  const removeChild = registerOverlay(child);
  expect(isTopOverlay(parent)).toBe(false);
  expect(dismissTopOverlay()).toBe(true);
  expect(child).toHaveBeenCalledOnce();
  expect(parent).not.toHaveBeenCalled();
  removeChild();
  expect(dismissTopOverlay()).toBe(true);
  expect(parent).toHaveBeenCalledOnce();
  removeParent();
  expect(dismissTopOverlay()).toBe(false);
});
