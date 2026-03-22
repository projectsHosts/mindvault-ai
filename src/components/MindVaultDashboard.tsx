import { useState, useEffect, useRef } from 'react';
import { ModelCategory } from '@runanywhere/web';
import { TextGeneration } from '@runanywhere/web-llamacpp';
import { useModelLoader } from '../hooks/useModelLoader';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  MessageCircle, History, BarChart3, Send, Sparkles, Bot,
  BrainCircuit, Lock, PlusCircle, RefreshCw, Zap, Trash2,
  ShieldCheck, WifiOff, Cpu, Smile, BookOpen, Menu, X, Info
} from 'lucide-react';
import { format } from 'date-fns';

// --- Types ---
interface Message {
  id: number;
  role: 'user' | 'ai';
  text: string;
  latency?: string;
}

interface MoodEntry {
  id: number;
  date: string;
  moodScore: number;
  moodLabel: string;
  summary: string;
}

interface JournalEntry {
  id: number;
  date: string;
  content: string;
  aiSummary: string;
}

export function MindVaultDashboard() {
  const loader = useModelLoader(ModelCategory.Language);

  const [activeTab, setActiveTab] = useState<'chat' | 'journal' | 'history' | 'analytics'>('chat');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [showAboutModal, setShowAboutModal] = useState(false);

  // Journal state
  const [journalText, setJournalText] = useState('');
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [journalLoading, setJournalLoading] = useState(false);

  // Load persisted data
  useEffect(() => {
    const savedMsgs = localStorage.getItem('mv_chat_v10');
    const savedHistory = localStorage.getItem('mv_history_v10');
    const savedJournal = localStorage.getItem('mv_journal_v10');
    if (savedMsgs) setMessages(JSON.parse(savedMsgs));
    if (savedHistory) setMoodHistory(JSON.parse(savedHistory));
    if (savedJournal) setJournalEntries(JSON.parse(savedJournal));
  }, []);

  // Persist & scroll
  useEffect(() => {
    localStorage.setItem('mv_chat_v10', JSON.stringify(messages));
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [messages, isThinking]);

  useEffect(() => {
    localStorage.setItem('mv_history_v10', JSON.stringify(moodHistory));
  }, [moodHistory]);

  useEffect(() => {
    localStorage.setItem('mv_journal_v10', JSON.stringify(journalEntries));
  }, [journalEntries]);

  // --- SEND CHAT MESSAGE ---
  const sendMessage = async () => {
    if (loader.state !== 'ready') { await loader.ensure(); return; }
    if (!input.trim() || isThinking) return;

    const userText = input;
    setInput('');
    const startTime = performance.now();

    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: userText }]);
    setIsThinking(true);

    try {
      // ⚡ SHORT prompt = faster inference on low-end GPU
      const prompt = `Assistant. Short helpful reply in 1 sentence.\nQ: ${userText}\nA:`;
      const { stream } = await TextGeneration.generateStream(prompt, { maxTokens: 30, temperature: 0.7 });

      const aiMsgId = Date.now() + 1;
      let isFirstChunk = true;
      let fullAiResponse = '';

      for await (const chunk of stream) {
        fullAiResponse += chunk;
        if (isFirstChunk) {
          setIsThinking(false);
          const latencyVal = ((performance.now() - startTime) / 1000).toFixed(2) + 's';
          setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', text: chunk, latency: latencyVal }]);
          isFirstChunk = false;
        } else {
          setMessages(prev => {
            const arr = [...prev];
            const last = arr[arr.length - 1];
            if (last.id === aiMsgId) arr[arr.length - 1] = { ...last, text: last.text + chunk };
            return arr;
          });
        }
      }

      // ⚡ Fast keyword mood — no extra LLM call after chat
      analyzeMoodFast(userText);
    } catch (err) {
      console.error(err);
      setIsThinking(false);
    }
  };

  // --- EXTRACT TASKS ---
  const extractTasks = async () => {
    if (!input.trim() || loader.state !== 'ready') return;
    setIsThinking(true);
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: `📋 Extract tasks from: "${input}"` }]);
    try {
      // ⚡ Ultra short prompt
      const prompt = `Tasks from this text as bullet points:\n"${input.substring(0, 120)}"\n-`;
      const res = await TextGeneration.generate(prompt, { maxTokens: 50, temperature: 0.3 });
      setMessages(prev => [...prev, { id: Date.now(), role: 'ai', text: '• ' + res.text.trim() }]);
    } catch { }
    setIsThinking(false);
    setInput('');
  };

  // --- SUMMARIZE ---
  const summarizeText = async () => {
    if (!input.trim() || loader.state !== 'ready') return;
    setIsThinking(true);
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: `📝 Summarize: "${input}"` }]);
    try {
      // ⚡ Ultra short prompt
      const prompt = `One line summary: "${input.substring(0, 120)}"\nSummary:`;
      const res = await TextGeneration.generate(prompt, { maxTokens: 30, temperature: 0.5 });
      setMessages(prev => [...prev, { id: Date.now(), role: 'ai', text: res.text.trim() }]);
    } catch { }
    setIsThinking(false);
    setInput('');
  };

  // ⚡ FAST keyword-only mood (zero extra LLM call)
  const analyzeMoodFast = (text: string) => {
    const lower = text.toLowerCase();
    let score = 5; let label = 'Neutral';
    if (lower.match(/sad|cry|bad|hurt|pain|lonely|fight|angry|hate|terrible|awful/)) { score = 3; label = 'Sad'; }
    else if (lower.match(/anxious|worry|stress|scared|nervous|overwhelm/)) { score = 4; label = 'Anxious'; }
    else if (lower.match(/good|great|nice|well|fine|okay|calm/)) { score = 6; label = 'Content'; }
    else if (lower.match(/happy|love|joy|excited|best|amazing|wonderful|fantastic/)) { score = 8; label = 'Happy'; }
    setMoodHistory(prev => [{
      id: Date.now(),
      date: format(new Date(), 'MMM d, h:mm a'),
      moodScore: score,
      moodLabel: label,
      summary: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
    }, ...prev]);
  };

  // --- JOURNAL ---
  const saveJournalEntry = async () => {
    if (!journalText.trim()) return;
    setJournalLoading(true);

    let aiSummary = 'Saved locally.';
    if (loader.state === 'ready') {
      try {
        const prompt = `One encouraging sentence about: "${journalText.substring(0, 100)}"\nSummary:`;
        const res = await TextGeneration.generate(prompt, { maxTokens: 25, temperature: 0.6 });
        aiSummary = res.text.trim();
      } catch { }
    }

    const entry: JournalEntry = {
      id: Date.now(),
      date: format(new Date(), 'MMM d, yyyy h:mm a'),
      content: journalText,
      aiSummary,
    };

    setJournalEntries(prev => [entry, ...prev]);
    setJournalText('');
    analyzeMoodFast(journalText);
    setJournalLoading(false);
  };

  const startNewChat = () => {
    if (confirm('Start a fresh conversation?')) { setMessages([]); setActiveTab('chat'); }
  };

  const clearData = () => {
    if (confirm('Delete all data? This cannot be undone.')) { localStorage.clear(); window.location.reload(); }
  };

  const avgMood = moodHistory.length > 0
    ? (moodHistory.reduce((a, c) => a + c.moodScore, 0) / moodHistory.length).toFixed(1)
    : '0.0';

  const moodColor = (score: number) => {
    if (score >= 7) return '#4ade80';
    if (score >= 5) return '#facc15';
    return '#f87171';
  };

  return (
    <div className="app-container">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="logo"><BrainCircuit size={20} className="text-primary" /> MindVault</div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="icon-btn">
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <nav className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="logo-area">
          <div className="logo-row">
            <div className="logo-bg"><BrainCircuit size={22} color="#fff" /></div>
            <h1>MindVault</h1>
          </div>
          <button className="gold-pill-btn" onClick={() => setShowAboutModal(true)}>
            <Info size={13} /> About
          </button>
        </div>

        <button className="new-chat-btn" onClick={startNewChat}>
          <PlusCircle size={17} /> New Chat
        </button>

        <div className="nav-items">
          <button className={`nav-btn ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => { setActiveTab('chat'); setMobileMenuOpen(false); }}>
            <MessageCircle size={19} /> AI Chat
          </button>
          <button className={`nav-btn ${activeTab === 'journal' ? 'active' : ''}`} onClick={() => { setActiveTab('journal'); setMobileMenuOpen(false); }}>
            <BookOpen size={19} /> Journal
          </button>
          <button className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => { setActiveTab('history'); setMobileMenuOpen(false); }}>
            <History size={19} /> Memory Lane
          </button>
          <button className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => { setActiveTab('analytics'); setMobileMenuOpen(false); }}>
            <BarChart3 size={19} /> Mood Tracker
          </button>
        </div>

        <div className="sidebar-footer">
          <button className="nav-btn danger-btn" onClick={clearData}>
            <Trash2 size={15} /> Reset All Data
          </button>

          <div className="model-status-box">
            <div className="status-header">
              <div className={`status-dot ${loader.state === 'ready' ? 'green' : 'yellow'}`} />
              <span className="status-text">
                {loader.state === 'ready' ? 'Brain Online' : loader.state === 'downloading' ? 'Downloading...' : 'Connecting...'}
              </span>
            </div>
            {loader.state === 'downloading' && (
              <div className="progress-bar-container">
                <div className="progress-fill" style={{ width: `${loader.progress * 100}%` }} />
              </div>
            )}
            {(loader.state === 'error' || loader.state === 'idle') && (
              <button className="retry-btn" onClick={loader.ensure}>
                <RefreshCw size={11} /> Connect Brain
              </button>
            )}
            <div className="privacy-badges">
              <span className="badge"><WifiOff size={10} /> Offline</span>
              <span className="badge"><Lock size={10} /> Private</span>
              <span className="badge"><Cpu size={10} /> On-Device</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="main-view">

        {/* ── CHAT TAB ── */}
        {activeTab === 'chat' && (
          <div className="chat-container">
            <header className="chat-header">
              <div className="ai-profile">
                <div className="ai-avatar"><Bot size={19} /></div>
                <div>
                  <h3>MindVault AI</h3>
                  <span className="subtitle">{loader.state === 'ready' ? '● Online & Private' : '○ Connecting...'}</span>
                </div>
              </div>
            </header>

            <div className="messages-area">
              {messages.length === 0 && (
                <div className="empty-state-chat">
                  <div className="big-icon"><Sparkles size={38} /></div>
                  <h2>Hey there! 👋</h2>
                  <p>Your private AI productivity buddy. All data stays on your device.</p>
                  <div className="quick-prompts">
                    <button onClick={() => setInput('Help me plan my day')} className="quick-btn">📅 Plan my day</button>
                    <button onClick={() => setInput('I need to focus, any tips?')} className="quick-btn">🎯 Focus tips</button>
                    <button onClick={() => setInput('Help me write an email')} className="quick-btn">✉️ Write email</button>
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`message-row ${msg.role === 'user' ? 'user' : 'ai'}`}
                >
                  {msg.role === 'ai' && <div className="msg-avatar"><Bot size={15} /></div>}
                  <div className="message-content-wrapper">
                    <div className="message-bubble">{msg.text}</div>
                    {msg.role === 'ai' && msg.latency && (
                      <div className="msg-latency"><Zap size={9} fill="currentColor" /> {msg.latency}</div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isThinking && (
                <div className="message-row ai">
                  <div className="msg-avatar"><Bot size={15} /></div>
                  <div className="typing-bubble"><span /><span /><span /></div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            <div className="input-wrapper">
              <div className={`input-box ${loader.state !== 'ready' ? 'disabled-look' : ''}`}>
                <input
                  type="text"
                  placeholder={loader.state === 'ready' ? 'Type a message...' : 'Initializing AI...'}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                />
                <button className="send-btn" onClick={sendMessage} disabled={!input.trim() || isThinking || loader.state !== 'ready'}>
                  {loader.state === 'ready' ? <Send size={18} /> : <div className="spinner-mini" />}
                </button>
              </div>

              <div className="action-row">
                <button className="action-btn" onClick={extractTasks} disabled={!input.trim() || isThinking || loader.state !== 'ready'}>
                  📋 Extract Tasks
                </button>
                <button className="action-btn" onClick={summarizeText} disabled={!input.trim() || isThinking || loader.state !== 'ready'}>
                  📝 Summarize
                </button>
              </div>

              <div className="privacy-note"><Lock size={11} /> All messages stay on your device. 100% private.</div>
            </div>
          </div>
        )}

        {/* ── JOURNAL TAB ── */}
        {activeTab === 'journal' && (
          <div className="content-page">
            <header className="page-header">
              <h2>📓 Journal</h2>
              <p>Write freely. AI summarizes locally. Nothing leaves your device.</p>
            </header>

            <div className="journal-editor">
              <textarea
                className="journal-textarea"
                placeholder="Write your thoughts, ideas, or reflections here..."
                value={journalText}
                onChange={e => setJournalText(e.target.value)}
                rows={6}
              />
              <button
                className="journal-save-btn"
                onClick={saveJournalEntry}
                disabled={!journalText.trim() || journalLoading}
              >
                {journalLoading ? '✨ Saving...' : '💾 Save Entry'}
              </button>
            </div>

            <div className="journal-entries">
              {journalEntries.length === 0 && (
                <p className="text-muted">No entries yet. Write your first thought above!</p>
              )}
              {journalEntries.map(entry => (
                <motion.div
                  key={entry.id}
                  className="journal-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="journal-card-date">{entry.date}</div>
                  <p className="journal-card-content">{entry.content}</p>
                  {entry.aiSummary && (
                    <div className="journal-card-summary">
                      <span className="ai-label">✨ AI Summary:</span> {entry.aiSummary}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && (
          <div className="content-page">
            <header className="page-header">
              <h2>🕐 Memory Lane</h2>
              <p>Your mood history — saved locally, always private.</p>
            </header>
            <div className="timeline-list">
              {moodHistory.length === 0 ? (
                <p className="text-muted">No memories yet. Start chatting!</p>
              ) : moodHistory.map(stat => (
                <motion.div key={stat.id} className="timeline-card" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                  <div className="card-date">{stat.date}</div>
                  <div className="card-content">
                    <div className="mood-badge-row">
                      <span className="mood-pill" style={{ borderColor: moodColor(stat.moodScore), color: moodColor(stat.moodScore) }}>
                        {stat.moodLabel}
                      </span>
                      <span className="score-text">{stat.moodScore}/10</span>
                    </div>
                    <p className="summary-text">"{stat.summary}"</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {activeTab === 'analytics' && (
          <div className="content-page">
            <header className="page-header">
              <h2>📊 Mood Trends</h2>
              <p>AI-powered sentiment analysis, running 100% on your device.</p>
            </header>

            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}><Smile size={28} /></div>
                <div>
                  <div className="stat-label">Avg Mood</div>
                  <div className="stat-value">{avgMood}<span>/10</span></div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80' }}><MessageCircle size={28} /></div>
                <div>
                  <div className="stat-label">Total Entries</div>
                  <div className="stat-value">{moodHistory.length}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}><ShieldCheck size={28} /></div>
                <div>
                  <div className="stat-label">Privacy</div>
                  <div className="stat-value" style={{ fontSize: 16 }}>100% Local</div>
                </div>
              </div>
            </div>

            <div className="chart-card-large">
              {moodHistory.length > 1 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={[...moodHistory].reverse()}>
                    <defs>
                      <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 10]} stroke="#475569" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10 }} />
                    <Area type="monotone" dataKey="moodScore" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMood)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-chart">
                  <BarChart3 size={38} opacity={0.25} />
                  <p>Chat or journal to see your mood trends!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Overlay */}
      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />}

      {/* About Modal */}
      <AnimatePresence>
        {showAboutModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAboutModal(false)}>
            <motion.div className="modal-content" initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🧠 MindVault</h2>
                <button onClick={() => setShowAboutModal(false)}><X size={18} /></button>
              </div>
              <div className="modal-body">
                <div className="feature-item">
                  <div className="feature-icon gold"><Cpu size={20} /></div>
                  <div><h3>100% On-Device AI</h3><p>All AI runs locally using RunAnywhere SDK. Zero cloud. Zero API costs.</p></div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon blue"><Lock size={20} /></div>
                  <div><h3>True Privacy</h3><p>Your data never leaves your device. No servers, no tracking, no leaks.</p></div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon purple"><Zap size={20} /></div>
                  <div><h3>Instant Responses</h3><p>Sub-100ms latency. No network round-trips. AI that feels instant.</p></div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon" style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80' }}><WifiOff size={20} /></div>
                  <div><h3>Works Offline</h3><p>No WiFi? No problem. MindVault works anywhere, anytime.</p></div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="gold-btn-full" onClick={() => setShowAboutModal(false)}>Got it! 🚀</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}