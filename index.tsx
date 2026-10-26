import ReactDOM from 'react-dom/client';
import { bootstrap } from './utils/bootstrap';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
await bootstrap(root, false);

import { registerServiceWorker } from './utils/sw-registration';
registerServiceWorker();
