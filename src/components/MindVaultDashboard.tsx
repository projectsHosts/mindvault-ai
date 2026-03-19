import { useState, useEffect, useRef } from 'react';
import { ModelCategory } from '@runanywhere/web';
import { TextGeneration } from '@runanywhere/web-llamacpp';
import { useModelLoader } from '../hooks/useModelLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  MessageCircle, History, BarChart3, Send, Sparkles, Bot, Menu, X, BrainCircuit, Lock, 
  PlusCircle, RefreshCw, Zap, Trash2, Info, ShieldCheck, WifiOff, Cpu, Smile, 
  Wrench, Camera, Mic
} from 'lucide-react';
import { format } from 'date-fns';

import { ToolsTab } from './ToolsTab';
import { VisionTab } from './VisionTab';
import { VoiceTab } from './VoiceTab';

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

export function MindVaultDashboard() {
  const loader = useModelLoader(ModelCategory.Language);
  
  const [activeTab, setActiveTab] = useState<'chat'|'history'|'analytics'|'tools'|'vision'|'voice'>('chat');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [showAboutModal, setShowAboutModal] = useState(false);

  // Load Data
  useEffect(() => {
    const savedMsgs = localStorage.getItem('mv_chat_v9');
    const savedHistory = localStorage.getItem('mv_history_v9');
    if (savedMsgs) setMessages(JSON.parse(savedMsgs));
    if (savedHistory) setMoodHistory(JSON.parse(savedHistory));
  }, []);

  // Save Data
  useEffect(() => {
    localStorage.setItem('mv_chat_v9', JSON.stringify(messages));
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [messages, isThinking]);

  useEffect(() => {
    localStorage.setItem('mv_history_v9', JSON.stringify(moodHistory));
  }, [moodHistory]);

  // --- ⚡ ULTRA FAST CHAT ---
  const sendMessage = async () => {
    if (loader.state !== 'ready') { await loader.ensure(); return; }
    if (!input.trim() || isThinking) return;

    const userText = input;
    setInput('');
    const startTime = performance.now();
    
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: userText }]);
    setIsThinking(true);

    try {
      const prompt = `System: Be a helpful friend. Concise answer. User: "${userText}" AI:`;
      const { stream } = await TextGeneration.generateStream(prompt, { maxTokens: 60, temperature: 0.7 });

      const aiMsgId = Date.now() + 1;
      let isFirstChunk = true;
      let fullAiResponse = "";

      for await (const chunk of stream) {
        fullAiResponse += chunk;
        if (isFirstChunk) {
          setIsThinking(false);
          const endTime = performance.now();
          const latencyVal = ((endTime - startTime) / 1000).toFixed(2) + "s";
          setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', text: chunk, latency: latencyVal }]);
          isFirstChunk = false;
        } else {
          setMessages(prev => {
            const newArr = [...prev];
            const lastIdx = newArr.length - 1;
            if (newArr[lastIdx].id === aiMsgId) newArr[lastIdx] = { ...newArr[lastIdx], text: newArr[lastIdx].text + chunk };
            return newArr;
          });
        }
      }

      analyzeMoodRobustly(userText);

    } catch (err) { console.error(err); setIsThinking(false); }
  };

  // --- 🧠 ROBUST MOOD ANALYSIS ---
  const analyzeMoodRobustly = (text: string) => {
    const lowerText = text.toLowerCase();
    let score = 5;
    let label = "Neutral";

    if (lowerText.match(/sad|cry|bad|hurt|pain|lonely|fight|angry|hate/)) {
      score = 3; label = "Low";
    } else if (lowerText.match(/happy|good|great|love|joy|excited|best/)) {
      score = 8; label = "Happy";
    } else if (lowerText.match(/anxious|worry|stress|scared|nervous/)) {
      score = 4; label = "Anxious";
    }

    const newEntry: MoodEntry = {
      id: Date.now(),
      date: format(new Date(), 'MMM d, h:mm a'),
      moodScore: score,
      moodLabel: label,
      summary: text.substring(0, 40) + "..."
    };

    setMoodHistory(prev => [newEntry, ...prev]);
  };

  const startNewChat = () => {
    if(confirm("Start a fresh conversation?")) { setMessages([]); setActiveTab('chat'); }
  };

  const clearData = () => {
    if(confirm("Delete all history?")) { localStorage.clear(); window.location.reload(); }
  };

  const handleNav = (tab: typeof activeTab) => { setActiveTab(tab); setMobileMenuOpen(false); };
  const handleRetryLoad = () => { loader.ensure(); };

  const avgMood = moodHistory.length > 0 
    ? (moodHistory.reduce((acc, curr) => acc + curr.moodScore, 0) / moodHistory.length).toFixed(1)
    : "0.0";

  return (
    <div className="app-container">
      <div className="mobile-header">
        <div className="logo"><BrainCircuit className="text-primary" /> MindVault</div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="icon-btn"><Menu /></button>
      </div>

      <nav className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="logo-area">
          <div className="logo-row"><div className="logo-bg"><BrainCircuit size={24} color="#fff" /></div><h1>MindVault</h1></div>
          <button className="gold-pill-btn" onClick={() => setShowAboutModal(true)}><Info size={14} /> About MindVault</button>
        </div>

        <button className="new-chat-btn" onClick={startNewChat}><PlusCircle size={18} /> New Chat</button>

        <div className="nav-items">
          <button className={`nav-btn ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => handleNav('chat')}><MessageCircle size={20} /> Chat Friend</button>
          <button className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => handleNav('history')}><History size={20} /> Memory Lane</button>
          <button className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => handleNav('analytics')}><BarChart3 size={20} /> Mood Tracker</button>

          {/* NEW TABS */}
         <button className={`nav-btn ${activeTab === 'tools' ? 'active' : ''}`} onClick={() => handleNav('tools')}><Wrench size={20} /> Tools</button>
          <button className={`nav-btn ${activeTab === 'vision' ? 'active' : ''}`} onClick={() => handleNav('vision')}><Camera size={20} /> Vision</button>
          <button className={`nav-btn ${activeTab === 'voice' ? 'active' : ''}`} onClick={() => handleNav('voice')}><Mic size={20} /> Voice</button>
        </div>

        <div className="sidebar-footer">
           <button className="nav-btn" style={{color:'#ef4444', justifyContent:'flex-start', paddingLeft:12}} onClick={clearData}><Trash2 size={16} /> Reset Data</button>
           <div className="model-status-box">
              <div className="status-header"><div className={`status-dot ${loader.state === 'ready' ? 'green' : 'yellow'}`} /><span className="status-text">{loader.state === 'ready' ? 'Brain Online' : 'Connecting...'}</span></div>
              {loader.state === 'downloading' && <div className="progress-bar-container"><div className="progress-fill" style={{width: `${loader.progress * 100}%`}}></div></div>}
              {(loader.state === 'error' || (loader.state === 'idle' && !loader.progress)) && <button className="retry-btn" onClick={handleRetryLoad}><RefreshCw size={12} /> Connect Brain</button>}
           </div>
        </div>
      </nav>

      <main className="main-view">
        {activeTab === 'chat' && (
          <div className="chat-container">
            <header className="chat-header">
              <div className="ai-profile"><div className="ai-avatar"><Bot size={20} /></div><div><h3>MindVault AI</h3><span className="subtitle">{loader.state === 'ready' ? '● Online & Private' : '○ Connecting...'}</span></div></div>
            </header>

            <div className="messages-area">
              {messages.length === 0 && <div className="empty-state-chat"><div className="big-icon"><Sparkles size={40} /></div><h2>Hey there! 👋</h2><p>I'm your private AI friend. I'm listening.</p></div>}
              {messages.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`message-row ${msg.role === 'user' ? 'user' : 'ai'}`}>
                  {msg.role === 'ai' && <div className="msg-avatar"><Bot size={16}/></div>}
                  <div className="message-content-wrapper"><div className="message-bubble">{msg.text}</div>{msg.role === 'ai' && msg.latency && <div className="msg-latency"><Zap size={10} fill="currentColor" /> {msg.latency}</div>}</div>
                </motion.div>
              ))}
              {isThinking && <div className="message-row ai"><div className="msg-avatar"><Bot size={16}/></div><div className="typing-bubble"><span></span><span></span><span></span></div></div>}
              <div ref={scrollRef} />
            </div>

            <div className="input-wrapper">
              <div className={`input-box ${loader.state !== 'ready' ? 'disabled-look' : ''}`}>
                <input type="text" placeholder={loader.state === 'ready' ? "Type a message..." : "Initializing..."} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
                <button className="send-btn" onClick={sendMessage} disabled={!input.trim() || isThinking || loader.state !== 'ready'}>{loader.state === 'ready' ? <Send size={20} /> : <div className="spinner-mini" />}</button>
              </div>
              <div className="privacy-note"><Lock size={12} /> Messages stay on this device.</div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="content-page">
            <header className="page-header"><h2>Memory Lane</h2><p>Every conversation is saved here locally.</p></header>
            <div className="timeline-list">
              {moodHistory.length === 0 ? <p className="text-muted">No memories yet. Start chatting!</p> : 
                moodHistory.map((stat) => (
                  <motion.div key={stat.id} className="timeline-card" initial={{opacity:0, x:-10}} animate={{opacity:1, x:0}}>
                     <div className="card-date">{stat.date}</div>
                     <div className="card-content">
                        <div className="mood-badge-row">
                           <span className="mood-pill">{stat.moodLabel}</span>
                           <span className="score-text">{stat.moodScore}/10</span>
                        </div>
                        <p className="summary-text">"{stat.summary}"</p>
                     </div>
                  </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="content-page">
            <header className="page-header"><h2>Mood Trends</h2></header>
            <div className="current-vibe-card">
              <div className="vibe-icon"><Smile size={32} /></div>
              <div className="vibe-info"><h3>Current Average</h3><div className="vibe-score">{avgMood} <span>/ 10</span></div></div>
            </div>
            <div className="chart-card-large">
              {moodHistory.length > 0 ? (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <AreaChart data={[...moodHistory].reverse()}>
                      <defs><linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#94a3b8" />
                      <YAxis domain={[0, 10]} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                      <Area type="monotone" dataKey="moodScore" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorMood)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="empty-chart"><BarChart3 size={40} opacity={0.3} /><p>Chat to see data!</p></div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tools' && <ToolsTab />}
        {activeTab === 'vision' && <VisionTab />}
        {activeTab === 'voice' && <VoiceTab />}
      </main>

      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />}
    </div>
  );
}