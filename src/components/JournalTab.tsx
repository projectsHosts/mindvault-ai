// import { useState, useEffect, useCallback } from 'react';
// import { ModelCategory } from '@runanywhere/web';
// import { TextGeneration } from '@runanywhere/web-llamacpp';
// import { useModelLoader } from '../hooks/useModelLoader';
// import { ModelBanner } from './ModelBanner';

// // --- Types ---
// interface JournalEntry {
//   id: string;
//   date: string; // ISO string
//   text: string;
//   mood: string; // "Happy", "Sad", "Neutral", etc.
//   insight: string;
// }

// export function JournalTab() {
//   const loader = useModelLoader(ModelCategory.Language);
  
//   // State
//   const [entries, setEntries] = useState<JournalEntry[]>([]);
//   const [currentEntry, setCurrentEntry] = useState('');
//   const [isAnalyzing, setIsAnalyzing] = useState(false);
//   const [showHistory, setShowHistory] = useState(false);

//   // Load from LocalStorage on mount
//   useEffect(() => {
//     const saved = localStorage.getItem('mindvault_entries');
//     if (saved) {
//       setEntries(JSON.parse(saved));
//     }
//   }, []);

//   // Save to LocalStorage whenever entries change
//   useEffect(() => {
//     localStorage.setItem('mindvault_entries', JSON.stringify(entries));
//   }, [entries]);

//   const analyzeAndSave = useCallback(async () => {
//     if (!currentEntry.trim() || isAnalyzing) return;
//     if (loader.state !== 'ready') {
//       await loader.ensure();
//     }

//     setIsAnalyzing(true);

//     try {
//       // 1. Prompt for Structured Data (JSON-like)
//       const prompt = `
//         Analyze this journal entry.
//         Entry: "${currentEntry}"
        
//         Output strictly in this format:
//         Mood: [One word: Happy, Sad, Anxious, Excited, Tired, Calm]
//         Insight: [1 sentence advice]
//       `;

//       const result = await TextGeneration.generate(prompt, {
//         maxTokens: 100,
//         temperature: 0.5,
//       });

//       // 2. Parse the AI Response (Simple Regex)
//       const text = result.text;
//       const moodMatch = text.match(/Mood:\s*([a-zA-Z]+)/i);
//       const insightMatch = text.match(/Insight:\s*(.+)/i);

//       const detectedMood = moodMatch ? moodMatch[1] : 'Neutral';
//       const detectedInsight = insightMatch ? insightMatch[1] : text;

//       // 3. Create New Entry
//       const newEntry: JournalEntry = {
//         id: Date.now().toString(),
//         date: new Date().toISOString(),
//         text: currentEntry,
//         mood: detectedMood,
//         insight: detectedInsight,
//       };

//       // 4. Save & Reset
//       setEntries([newEntry, ...entries]); // Add to top
//       setCurrentEntry('');
//       setShowHistory(true); // Switch to history view to show success

//     } catch (err) {
//       console.error(err);
//       alert("AI Brain is tired. Try again.");
//     } finally {
//       setIsAnalyzing(false);
//     }
//   }, [currentEntry, isAnalyzing, loader, entries]);

//   // Helper to get Mood Emoji
//   const getMoodEmoji = (mood: string) => {
//     const m = mood.toLowerCase();
//     if (m.includes('happy') || m.includes('excit')) return '😊';
//     if (m.includes('sad') || m.includes('tired')) return '😔';
//     if (m.includes('anxious') || m.includes('stress')) return '😰';
//     if (m.includes('calm')) return '😌';
//     return '😐';
//   };

//   return (
//     <div className="tab-panel journal-panel">
//       <ModelBanner
//         state={loader.state}
//         progress={loader.progress}
//         error={loader.error}
//         onLoad={loader.ensure}
//         label="AI Brain"
//       />

//       <div className="dashboard-grid">
        
//         {/* LEFT: New Entry Area */}
//         <div className="entry-section">
//           <div className="section-header">
//              <h2>📝 New Entry</h2>
//              <span className="date-badge">{new Date().toLocaleDateString()}</span>
//           </div>
          
//           <textarea
//             className="journal-textarea"
//             placeholder="What's on your mind? (Your data stays offline)"
//             value={currentEntry}
//             onChange={(e) => setCurrentEntry(e.target.value)}
//             disabled={isAnalyzing}
//           />
          
//           <button 
//             className={`btn btn-primary btn-block ${isAnalyzing ? 'pulsing' : ''}`}
//             onClick={analyzeAndSave}
//             disabled={!currentEntry.trim() || isAnalyzing}
//           >
//             {isAnalyzing ? '🧠 AI is Analyzing...' : 'Save & Analyze'}
//           </button>
//         </div>

//         {/* RIGHT: History & Analytics */}
//         <div className="history-section">
//           <div className="section-header">
//             <h2>📊 Mood History</h2>
//             <div className="stats-pill">
//               {entries.length} Entries
//             </div>
//           </div>

//           {entries.length === 0 ? (
//             <div className="empty-history">
//               <p>No entries yet. Write something!</p>
//             </div>
//           ) : (
//             <div className="entries-list">
//               {entries.map((item) => (
//                 <div key={item.id} className="history-card">
//                   <div className="card-top">
//                     <span className="mood-badge">
//                       {getMoodEmoji(item.mood)} {item.mood}
//                     </span>
//                     <span className="entry-date">
//                       {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
//                     </span>
//                   </div>
//                   <p className="entry-text-preview">{item.text}</p>
//                   <div className="ai-insight-box">
//                     <strong>💡 AI:</strong> {item.insight}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//       </div>
//     </div>
//   );
// }