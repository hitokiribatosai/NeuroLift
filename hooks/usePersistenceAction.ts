import { useRef } from 'react';
import { reportPersistenceFailure } from '../utils/workspace';

/** Serializes explicit save/delete actions; callers change UI only after await. */
export function usePersistenceAction() {
  const running = useRef(false);
  return async (action: () => Promise<void>) => {
    if (running.current) return;
    running.current = true;
    try { await action(); }
    catch (error) { reportPersistenceFailure(error); }
    finally { running.current = false; }
  };
}
