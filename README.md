# MindVault

**A privacy-first AI productivity web app — all inference runs locally in your browser.**

Built for **HackXtreme** | Problem Statement #1 — AI-Powered Productivity Tools
Powered by **RunAnywhere SDK** | Zero Cloud · Zero APIs · Zero Data Transmission

---

## Overview

MindVault is a productivity companion where the AI model runs entirely on the user's device via WebAssembly. No servers. No API keys. No internet required after the first load. Every message, journal entry, and mood data point stays on the device — permanently.

---

## Features

- **AI Chat** — Conversational assistant powered by a local LLM, streamed token by token in the browser
- **Extract Tasks** — Paste any block of text and the on-device model extracts actionable tasks instantly
- **Summarize** — Condenses notes, emails, or documents into a single clear sentence using local inference
- **Journal** — Private writing space where AI generates an encouraging summary, stored in localStorage
- **Mood Tracker** — Keyword-based sentiment analysis that tracks emotional trends across conversations
- **Memory Lane** — Full mood history with labels and scores, persisted locally across sessions
- **Mood Trends** — Area chart visualizing mood patterns over time

---

## Why Local AI

| Cloud AI | MindVault |
|---|---|
| $0.08 – $0.35 per minute in API costs | Zero inference cost — runs on device |
| Requires internet at all times | Fully offline after first model download |
| User data transmitted to external servers | Data never leaves the browser |
| 300 – 400ms network latency per request | Zero network round-trips |

---

## Tech Stack

- **Framework** — React 18 + TypeScript + Vite
- **AI Runtime** — RunAnywhere SDK (`@runanywhere/web`, `@runanywhere/web-llamacpp`)
- **Model** — LFM2-350M Q4\_K\_M by LiquidAI, executed via LlamaCPP WebAssembly
- **Charts** — Recharts
- **Animations** — Framer Motion
- **Icons** — Lucide React
- **Typography** — Sora, JetBrains Mono

---

## Getting Started

**Clone the repository**
```bash
git clone git https://github.com/projectsHosts/mindvault-ai.git
cd mindvault
```

**Install dependencies**
```bash
npm install
```

**Start the development server**
```bash
npm run dev
```

**Open in browser**
```
http://localhost:5173
```

> Use Chrome for best WebGPU support. On first load, the AI model (~250MB) downloads once and is cached in the browser permanently.

---

## Project Structure

```
src/
├── components/
│   └── MindVaultDashboard.tsx    Main application — all tabs and AI logic
├── hooks/
│   └── useModelLoader.ts         Model download and load state management
├── styles/
│   └── index.css                 Full design system and CSS variables
├── workers/
│   └── vlm-worker.ts             VLM web worker entry point
├── runanywhere.ts                SDK initialization and model registration
├── App.tsx                       Root component with loading screen
└── main.tsx                      Entry point
```

---

## How the AI Works

```
User input
    →  RunAnywhere SDK (browser context)
    →  LlamaCPP (WebAssembly / WebGPU acceleration)
    →  LFM2-350M model (cached in browser storage)
    →  Streamed tokens — zero network calls
```

All five AI features run on the same single local model. The prompt changes per feature:

- Chat — ChatML format conversational prompt
- Extract Tasks — structured bullet point extraction prompt
- Summarize — single sentence compression prompt
- Journal Summary — warm reflective summary prompt
- Mood Analysis — instant keyword-based classification, no inference cost

---

## Judging Criteria

| Criteria | Implementation |
|---|---|
| Innovation and Creativity | Mood tracking and private journaling powered entirely by on-device AI |
| Technical Execution | RunAnywhere SDK with streaming LLM, WebAssembly inference, ChatML prompting |
| User Experience | Polished dark UI, real-time token streaming, mobile responsive layout |
| Practical Impact | A daily-use productivity tool that works offline with zero data exposure |
| Local AI Benefits | Privacy by architecture, zero cloud cost, offline-first by design |

---

## Team

> Yogesh Nayak & Abhishek Nayak | Lynxes Team

---

## License

MIT License — free to use, modify, and distribute.

---

*Built at HackXtreme · Powered by RunAnywhere SDK*
*The future of AI is on the device, not in the cloud.*