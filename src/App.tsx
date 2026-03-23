import { useState, useEffect } from 'react';
import { initSDK } from './runanywhere';
import { MindVaultDashboard } from './components/MindVaultDashboard';
import { EventBus } from '@runanywhere/web';
import {
  BrainCircuit, Search, Download, Lock, Zap, Cpu, CheckCircle,
  RefreshCw, WifiOff, ShieldCheck, Plane, AlertTriangle
} from 'lucide-react';

const LOADING_STEPS = [
  { icon: Search,       text: 'Checking your device capabilities...' },
  { icon: Download,     text: 'Downloading AI model to your device...' },
  { icon: Lock,         text: 'Setting up private local inference...' },
  { icon: Zap,          text: 'Loading AI into browser memory...' },
  { icon: Cpu,          text: 'Warming up your personal AI brain...' },
  { icon: CheckCircle,  text: 'Almost ready...' },
];

export function App() {
  const [sdkReady, setSdkReady]           = useState(false);
  const [sdkError, setSdkError]           = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [stepIndex, setStepIndex]         = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [dots, setDots]                   = useState('');

  // Animated dots
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
    return () => clearInterval(t);
  }, []);

  // Cycle loading messages
  useEffect(() => {
    if (sdkReady) return;
    const t = setInterval(() => setStepIndex(i => i < LOADING_STEPS.length - 1 ? i + 1 : i), 2500);
    return () => clearInterval(t);
  }, [sdkReady]);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    try {
      unsub = EventBus.shared.on('model.downloadProgress', (evt: any) => {
        setIsDownloading(true);
        setDownloadProgress(evt.progress ?? 0);
        setStepIndex(1);
      });
    } catch (_) {}

    initSDK()
      .then(() => {
        setDownloadProgress(1);
        setStepIndex(5);
        setTimeout(() => setSdkReady(true), 800);
      })
      .catch(err => setSdkError(err instanceof Error ? err.message : String(err)));

    return () => { unsub?.(); };
  }, []);

  // ── Error ──
  if (sdkError) {
    return (
      <div style={s.container}>
        <div style={s.blob1} /><div style={s.blob2} />
        <div style={s.card}>
          <div style={{ ...s.iconCircle, background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
            <AlertTriangle size={28} />
          </div>
          <h2 style={{ color: '#f87171', fontSize: 20, fontWeight: 700, margin: 0 }}>
            Failed to Initialize
          </h2>
          <p style={{ color: '#64748b', fontSize: 13, textAlign: 'center', margin: 0 }}>
            {sdkError}
          </p>
          <button style={s.retryBtn} onClick={() => window.location.reload()}>
            <RefreshCw size={14} style={{ marginRight: 6 }} />
            Retry
          </button>
        </div>
        <style>{ANIM_CSS}</style>
      </div>
    );
  }

  // ── Loading ──
  if (!sdkReady) {
    const pct = Math.round(downloadProgress * 100);
    const Step = LOADING_STEPS[stepIndex];
    const StepIcon = Step.icon;

    return (
      <div style={s.container}>
        <div style={s.blob1} /><div style={s.blob2} />

        <div style={s.card}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={s.logoBox}>
              <BrainCircuit size={26} color="#fff" />
            </div>
            <h1 style={s.logoText}>MindVault</h1>
          </div>

          <p style={{ color: '#64748b', fontSize: 14, margin: 0, textAlign: 'center' }}>
            Your Private AI Productivity Companion
          </p>

          {/* Step indicator */}
          <div style={s.stepBox}>
            <div style={{ ...s.stepIconWrap, color: '#a78bfa' }}>
              <StepIcon size={18} />
            </div>
            <span style={{ fontSize: 13, color: '#a78bfa', fontWeight: 500 }}>
              {Step.text}{dots}
            </span>
          </div>

          {/* Progress bar when downloading */}
          {isDownloading ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={s.progressTrack}>
                <div style={{ ...s.progressFill, width: `${pct}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Download size={11} /> Downloading AI Model
                </span>
                <span style={{ color: '#a78bfa', fontWeight: 700 }}>{pct}%</span>
              </div>
              <p style={{ fontSize: 11, color: '#334155', margin: 0, textAlign: 'center' }}>
                ~250MB · Downloads once, cached in your browser forever
              </p>
            </div>
          ) : (
            <div style={{ padding: '6px 0' }}>
              <div style={s.spinnerRing} />
            </div>
          )}

          {/* Privacy badges */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { icon: <ShieldCheck size={11} />, label: '100% Private' },
              { icon: <WifiOff size={11} />,     label: 'No Cloud'     },
              { icon: <Cpu size={11} />,         label: 'On-Device AI' },
            ].map(b => (
              <span key={b.label} style={s.badge}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {b.icon} {b.label}
                </span>
              </span>
            ))}
          </div>

          {/* Step dots */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {LOADING_STEPS.map((_, i) => (
              <div key={i} style={{
                width: 7, height: 7, borderRadius: '50%',
                background: i <= stepIndex ? '#7c3aed' : '#1e293b',
                transform: i === stepIndex ? 'scale(1.4)' : 'scale(1)',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <p style={{ color: '#1e293b', fontSize: 12, marginTop: 20, textAlign: 'center', position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Plane size={12} /> After first load, MindVault works completely offline
        </p>

        <style>{ANIM_CSS}</style>
      </div>
    );
  }

  return <MindVaultDashboard />;
}

// ── Animation keyframes ──
const ANIM_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap');
  @keyframes spin  { to { transform: rotate(360deg); } }
  @keyframes blob  {
    0%,100% { border-radius: 60% 40% 30% 70%/60% 30% 70% 40%; }
    50%     { border-radius: 30% 60% 70% 40%/50% 60% 30% 60%; }
  }
`;

// ── Inline styles ──
const s: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#080c14',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Sora', sans-serif",
    position: 'relative', overflow: 'hidden',
    padding: 20,
  },
  blob1: {
    position: 'absolute', width: 450, height: 450,
    background: 'radial-gradient(circle, rgba(124,58,237,0.13) 0%, transparent 70%)',
    top: '5%', left: '5%',
    animation: 'blob 8s ease-in-out infinite',
    borderRadius: '60% 40% 30% 70%/60% 30% 70% 40%',
  },
  blob2: {
    position: 'absolute', width: 350, height: 350,
    background: 'radial-gradient(circle, rgba(67,56,202,0.1) 0%, transparent 70%)',
    bottom: '5%', right: '5%',
    animation: 'blob 10s ease-in-out infinite reverse',
    borderRadius: '30% 60% 70% 40%/50% 60% 30% 60%',
  },
  card: {
    background: 'rgba(15,22,35,0.95)',
    border: '1px solid rgba(124,58,237,0.25)',
    borderRadius: 28, padding: '48px 40px',
    width: '100%', maxWidth: 440,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 20,
    backdropFilter: 'blur(20px)',
    boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 60px rgba(124,58,237,0.07)',
    position: 'relative', zIndex: 1,
  },
  iconCircle: {
    width: 60, height: 60, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoBox: {
    width: 52, height: 52,
    background: 'linear-gradient(135deg, #6d28d9, #4338ca)',
    borderRadius: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 30px rgba(109,40,217,0.45)',
  },
  logoText: {
    fontSize: 28, fontWeight: 700,
    background: 'linear-gradient(135deg, #e2d9f3, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
  },
  stepBox: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'rgba(124,58,237,0.08)',
    border: '1px solid rgba(124,58,237,0.2)',
    borderRadius: 12, padding: '12px 18px',
    width: '100%', minHeight: 48,
  },
  stepIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    background: 'rgba(124,58,237,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  progressTrack: {
    height: 6, background: '#1e293b',
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
    borderRadius: 3, transition: 'width 0.4s ease',
    boxShadow: '0 0 10px rgba(124,58,237,0.6)',
  },
  spinnerRing: {
    width: 40, height: 40,
    border: '3px solid rgba(124,58,237,0.15)',
    borderTopColor: '#7c3aed',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  badge: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    color: '#475569', padding: '5px 12px',
    borderRadius: 999, fontSize: 11, fontWeight: 500,
  },
  retryBtn: {
    background: 'linear-gradient(135deg, #7c3aed, #4338ca)',
    color: 'white', border: 'none',
    padding: '10px 24px', borderRadius: 12,
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    fontFamily: "'Sora', sans-serif",
    display: 'flex', alignItems: 'center',
  },
};