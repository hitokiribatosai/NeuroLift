import React from 'react';
import { createRoot } from 'react-dom/client';
import { PersistenceNotice } from '../../components/ui/PersistenceNotice';
import '../../components/web/website.css';

export function showRecoveryNotice() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  createRoot(host).render(<PersistenceNotice />);
}
