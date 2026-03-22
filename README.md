# 🧠 MindVault
### Your Private AI Productivity Companion — Runs 100% On Your Device

> Built for **HackXtreme** | Category: **Web App — Problem Statement #1 (AI-Powered Productivity Tools)**  
> Powered by **RunAnywhere SDK** | Zero Cloud · Zero APIs · Zero Privacy Risk

---

## 🎯 What is MindVault?

MindVault is a privacy-first AI productivity web app where **all AI inference runs locally in your browser** — no servers, no API keys, no internet required after the first load.

Your thoughts, tasks, and conversations **never leave your device**. Ever.

---

## ✨ Features

| Feature | Description |
|---|---|
| 💬 **AI Chat** | Chat with a local LLM running in your browser via WebAssembly |
| 📋 **Extract Tasks** | Paste any text — AI pulls out actionable tasks instantly |
| 📝 **Summarize** | Summarize notes, emails, or documents in one line |
| 📓 **Journal** | Write freely — AI generates a warm summary, stored locally |
| 😊 **Mood Tracker** | Tracks your emotional trends from conversations over time |
| 🕐 **Memory Lane** | Browse your full mood history, saved in localStorage |
| 📊 **Mood Trends** | Beautiful area chart showing your mood patterns |

---

## 🔒 Why Local AI?

| Problem (Cloud AI) | MindVault Solution |
|---|---|
| 💸 $0.08–0.35/min API costs | **$0.00 forever — inference on device** |
| 🌐 Needs internet always | **Works fully offline after first load** |
| 😰 Your data on external servers | **Data never leaves your browser** |
| ⏳ 300–400ms network latency | **Zero network round-trips** |

---

## 🛠️ Tech Stack

- **Framework:** React + TypeScript + Vite
- **AI SDK:** [RunAnywhere](https://runanywhere.ai) (`@runanywhere/web`, `@runanywhere/web-llamacpp`)
- **Model:** LFM2-350M Q4_K_M (LiquidAI) — runs via LlamaCPP WebAssembly
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Fonts:** Sora + JetBrains Mono

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git https://github.com/projectsHosts/mindvault-ai.git
cd mindvault
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run locally
```bash
npm run dev
```

### 4. Open in Chrome
```
http://localhost:5173
```

> ⚠️ **Use Chrome** for best WebGPU support. On first load, the AI model (~250MB) downloads once and is cached in your browser.

---

## 📁 Project Structure

```
src/
├── components/
│   └── MindVaultDashboard.tsx   # Main app — all tabs & AI logic
├── hooks/
│   └── useModelLoader.ts        # Model download + load state
├── styles/
│   └── index.css                # Full design system
├── workers/
│   └── vlm-worker.ts            # VLM web worker
├── runanywhere.ts               # SDK init + model registration
├── App.tsx                      # Root component
└── main.tsx                     # Entry point
```

---

## 🤖 How the AI Works

```
User types message
       ↓
RunAnywhere SDK (browser)
       ↓
LlamaCPP (WebAssembly / WebGPU)
       ↓
LFM2-350M model (cached locally)
       ↓
Streamed response — no network call
```

**All 5 AI features use the same single local model** — just different prompts:
- Chat → conversational prompt
- Extract Tasks → bullet point extraction prompt  
- Summarize → one-line summary prompt
- Journal Summary → warm encouraging prompt
- Mood Analysis → keyword-based sentiment (instant, zero inference cost)

---

## 🏆 HackXtreme Judging Criteria

| Criteria | MindVault |
|---|---|
| ✅ Innovation & Creativity | First-time mood tracking + journaling with fully local AI |
| ✅ Technical Execution | RunAnywhere SDK, streaming LLM, WebAssembly inference |
| ✅ User Experience | Polished UI, fast streaming, mobile responsive |
| ✅ Practical Impact | Real productivity tool usable daily, offline |
| ✅ Local AI Benefits | Privacy by architecture, zero cloud cost, offline-first |

---

## 📸 Screenshots

> ![alt text](image.png)![![alt text](image-2.png)](image-1.png)![alt text](image-3.png)

---

## 👥 Team

> Yogesh Nayak | Lynexes Team

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

<div align="center">
  <strong>Built with ❤️ at HackXtreme · Powered by RunAnywhere SDK</strong><br/>
  <em>The future of AI isn't in the cloud — it's on your device.</em>
</div>