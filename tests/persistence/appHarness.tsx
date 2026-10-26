import { createRoot } from 'react-dom/client';
import { bootstrap } from '../../utils/bootstrap';

export async function startMigratedApp() {
  document.body.textContent = '';
  const host = document.createElement('div');
  document.body.appendChild(host);
  await bootstrap(createRoot(host), true);
}
