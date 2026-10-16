# 🌿 FocusFlow — Premium Productivity & Mindful Focus Companion

> A peaceful, distraction-free productivity web app and installable PWA featuring morning briefings, Pomodoro focus sessions, smart alarms with puzzle challenges, synthesized ambient sounds, and gamified streak achievements.

[![Open FocusFlow](https://img.shields.io/badge/Open%20App-http%3A%2F%2Flocalhost%3A5173%2F-7a9e6b?style=for-the-badge)](http://localhost:5173/)

👉 **[Click here to open FocusFlow directly in your browser: http://localhost:5173/](http://localhost:5173/)**

---

## ⚡ Features

### 🌅 1. Morning Briefing & Day Routine
- **Daily Context**: Today's date, personalized greeting, daily curated motivational quotes with 1-click clipboard copy, and fresh productivity ideas.
- **Smart Workday Planning**: Visual gauge tracking remaining tasks and estimated minutes against your configured daily focus capacity (e.g. 8-hour workday).
- **On-Demand Access**: Open the Morning Briefing anytime from the TopBar Sunrise button or automatically when waking up from an alarm.

### ⏱️ 2. Pomodoro Focus Engine
- **Flexible Modes**: Focus sessions, Short Breaks, and Long Breaks with customized cycle counts.
- **Visual & Audio Feedback**:
  - Precision animated SVG ring timer with smooth countdown transitions.
  - Optional subtle ticking sound pulse during active focus.
  - Harmonious four-tone completion chime synthesized through the Web Audio API.
  - Mini-timer widget integrated into the Dashboard.
- **Local State Recovery**: Timer automatically persists and restores across browser tab closures and reloads.

### ⏰ 3. Smart Alarms with Puzzle Challenges
- **Custom Schedules**: Set multiple alarms with custom recurrence days (e.g., Weekdays, Weekends, Every day) and snooze intervals.
- **Wake-up Challenges**:
  - **Math Puzzle**: Arithmetic calculation tailored to your difficulty setting (Easy, Medium, Hard).
  - **Word Search**: Dynamic interactive word-search grid with mouse drag and touch-screen drag-selection.
- **Global In-App Ringing**: Alarms trigger anywhere in the app with ascending audio alert buzzers.

### 📝 4. Intelligent Task Tracking
- **Planning Parameters**: Add tasks with priority badges (`High`, `Medium`, `Low`), estimated completion minutes, and planned start times (`HH:MM`).
- **Zero Friction**: Instant 1-click completion toggle, filtering by status (`All`, `Pending`, `Completed`), and sorting by planned time, priority, or creation date.

### 🎵 5. Web Audio Ambient Soundscape
- **Synthesized Audio**: Rain on rooftop, coffee shop hum, and forest breeze generated in real time with audio oscillators without loading external audio files.
- **Master Audio Controls**: Volume slider, instantaneous mute toggle, and gentle playback transitions.

### 🏆 6. XP, Streaks & Achievements
- **Level Progression**: Earn XP on completing tasks, finishing focus sessions, achieving first-task-of-day bonuses, and clearing all daily items.
- **Streak Tracker**: Tracks current streak and all-time record day streaks.
- **Badge Unlocks**: Unlock achievements like *First Step*, *Deep Diver*, *Marathon Focus*, *Week of Dedication*, and *Century Club*.

### 📊 7. Visual Statistics Dashboard
- **Productivity Charts**: 7-day, 30-day, and all-time interactive bar charts for focus minutes and completed tasks.
- **Key Metrics**: Total focus duration, sessions completed, and personal best productivity day.

### ⚙️ 8. Offline Privacy & PWA
- **100% Client-Side Privacy**: Data stored locally in IndexedDB (`Dexie.js`) and `localStorage`. No accounts, no external tracking.
- **Backup & Restore**: 1-click JSON backup export and restore.
- **Installable PWA**: Works completely offline as a standalone native-feeling application on Desktop, iOS, and Android.

---

## 🚀 Quick Start

### 1. Launch Development Server
```bash
npm run dev
```
The server will start and open your browser automatically at:
**[http://localhost:5173/](http://localhost:5173/)**

### 2. Build for Production
```bash
npm run build
```

### 3. Preview Production Build
```bash
npm run preview
```

---

## 🛠️ Tech Stack
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Vanilla Design Token CSS System
- **State Management**: Zustand
- **Local Database**: IndexedDB (Dexie) with custom reactive `useLiveQuery` hook
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **PWA**: `vite-plugin-pwa` with Workbox offline caching and Web App Manifest
