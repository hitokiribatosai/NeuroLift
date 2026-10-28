import { useEffect } from 'react';
import { holdWorkspaceRefresh } from '../utils/workspace';

/** Keep in-progress forms and workout controls stable during background refresh. */
export function useWorkspaceEditing() {
  useEffect(() => holdWorkspaceRefresh(), []);
}
