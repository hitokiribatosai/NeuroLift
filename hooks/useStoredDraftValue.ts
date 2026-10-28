import { Dispatch, SetStateAction, useCallback, useRef, useState } from 'react';
import { safeStorage } from '../utils/storage';
import { scope } from '../utils/workspace';

/** Queue draft edits before rendering, never from a delayed effect or another account. */
export function useStoredDraftValue<T>(key: string, read: () => T, encode: (value: T) => string | null): [T, Dispatch<SetStateAction<T>>] {
  const owner = useRef(scope());
  const [value, setValue] = useState(read);
  const current = useRef(value);
  const update: Dispatch<SetStateAction<T>> = useCallback(action => {
    if (scope() !== owner.current) return;
    const next = typeof action === 'function' ? (action as (value: T) => T)(current.current) : action;
    safeStorage.setItems({ [key]: encode(next) });
    current.current = next;
    setValue(next);
  }, [key, encode]);
  return [value, update];
}
