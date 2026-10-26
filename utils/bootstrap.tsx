import React from 'react';
import { Root } from 'react-dom/client';
import App from '../App';
import { StartupRecovery } from '../components/ui/StartupRecovery';
import { migrateLegacyStorage } from './storage';
import { initializeWorkspace, readWorkspace } from './workspace';

/** Shared production/canary bootstrap. No legacy fallback after a failed migration. */
export async function bootstrap(root: Root, structuredStorage: boolean) {
  try {
    await migrateLegacyStorage();
    if (structuredStorage) await initializeWorkspace();
    readWorkspace();
    root.render(<React.StrictMode><App /></React.StrictMode>);
  } catch {
    root.render(<StartupRecovery retry={() => bootstrap(root, structuredStorage)} />);
  }
}
