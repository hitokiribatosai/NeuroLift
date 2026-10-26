import React from 'react';
import { createRoot } from 'react-dom/client';
import { PersistenceNotice } from '../../components/ui/PersistenceNotice';
import '../../components/web/website.css';
import { RecordConflicts } from '../../components/features/RecordConflicts';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { PendingRecord } from '../../utils/persistence/recordSyncState';

export function showRecoveryNotice() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  createRoot(host).render(<PersistenceNotice />);
}

export function showRecordConflicts(records: PendingRecord[]) {
  const host = document.createElement('div');
  host.className = 'website-redesign';
  document.body.appendChild(host);
  createRoot(host).render(<LanguageProvider><RecordConflicts records={records} /></LanguageProvider>);
}
