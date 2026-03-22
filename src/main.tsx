import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/index.css';

// ⚡ Block telemetry for offline-first performance
const originalFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof Request
      ? input.url
      : input.toString();

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