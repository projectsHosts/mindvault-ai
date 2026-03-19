import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/index.css';

// --- ⚡ SPEED HACK: BLOCK TELEMETRY (NO OFFLINE LAG) ---
const originalFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof Request
      ? input.url
      : input.toString();

  // Block telemetry / analytics requests
  if (url.includes('telemetry') || url.includes('stats') || url.includes('analytics')) {
    return new Response(null, { status: 204 });
  }

  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);