import { useState, useEffect } from 'react';
import { initSDK } from './runanywhere';
import { MindVaultDashboard } from './components/MindVaultDashboard';

export function App() {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);

  useEffect(() => {
    initSDK()
      .then(() => setSdkReady(true))
      .catch((err) => setSdkError(err instanceof Error ? err.message : String(err)));
  }, []);

  if (sdkError) {
    return (
      <div className="app-loading">
        <p style={{ color: '#f87171', fontFamily: 'Sora, sans-serif' }}>
          ⚠️ {sdkError}
        </p>
      </div>
    );
  }

  if (!sdkReady) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        <h2 style={{ marginTop: 20, color: '#64748b', fontFamily: 'Sora, sans-serif', fontWeight: 500 }}>
          Initializing MindVault...
        </h2>
      </div>
    );
  }

  return <MindVaultDashboard />;
}