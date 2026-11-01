import { hydrateRoot } from 'react-dom/client';
import App from '../src/App';

// Client entry for the smoke test: hydrates the server-rendered
// page in a real browser. The server HTML wraps <App /> in
// <div id="root">; this hydrates exactly that tree.
const container = document.getElementById('root');

if (!container) {
  throw new Error('smoke test: #root container missing from the page');
}

hydrateRoot(container, <App />);
