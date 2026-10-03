import { useEffect, useState } from 'react';
import { safeStorage } from '../utils/storage';
import { usesModernInterface } from '../utils/interfacePlatform';

// Workspace-scoped UI preferences; deliberately not part of cloud sync.
export function useInterfaceState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => usesModernInterface() ? safeStorage.getParsed(`ui_${key}`, initial) : initial);
  useEffect(() => {
    if (usesModernInterface()) safeStorage.setItem(`ui_${key}`, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue] as const;
}
