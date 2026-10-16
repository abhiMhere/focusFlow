// ── Task ──────────────────────────────────────────────
export type Priority = 'low' | 'medium' | 'high'
export type TaskStatus = 'pending' | 'completed'

export interface Task {
  id: string
  title: string
  description?: string
  estimatedMinutes: number
  priority: Priority
  plannedStartTime?: string  // HH:MM
  deadline?: string           // ISO date string
  status: TaskStatus
  category?: string
  createdAt: string           // ISO
  completedAt?: string        // ISO
  date: string                // YYYY-MM-DD (the day this task belongs to)
}

// ── Pomodoro ──────────────────────────────────────────
export type SessionType = 'focus' | 'shortBreak' | 'longBreak'

export interface PomodoroSession {
  id: string
  taskId?: string
  type: SessionType
  durationMinutes: number
  startedAt: string   // ISO
  completedAt: string // ISO
  xpAwarded: boolean
  date: string        // YYYY-MM-DD
}

export interface TimerState {
  isRunning: boolean
  sessionType: SessionType
  targetEndTime: number | null  // ms epoch
  pausedRemaining: number | null // ms
  focusCount: number             // completed focus sessions this cycle
  associatedTaskId?: string
  sessionId?: string             // current session's UUID (to prevent double-award)
  completedSessionId?: string    // last completed session id
}

// ── Alarm ─────────────────────────────────────────────
export type DayOfWeek = 0|1|2|3|4|5|6  // 0=Sunday

export interface Alarm {
  id: string
  enabled: boolean
  time: string             // HH:MM
  label?: string
  days: DayOfWeek[]        // empty = every day
  snoozeMinutes: number    // 0 = no snooze
  puzzleEnabled: boolean
  puzzleType: 'math' | 'wordsearch'
  puzzleDifficulty: 'easy' | 'medium' | 'hard'
  briefingEnabled: boolean
  volume: number           // 0–1
}

// ── XP & Rewards ─────────────────────────────────────
export type XPEventType =
  | 'task_complete'
  | 'task_first_of_day'
  | 'session_complete'
  | 'all_tasks_complete'

export interface XPEvent {
  id: string
  type: XPEventType
  xp: number
  referenceId: string  // taskId or sessionId
  earnedAt: string     // ISO
  date: string         // YYYY-MM-DD
}

export interface Achievement {
  id: string
  unlockedAt: string  // ISO
}

export type AchievementId =
  | 'first_task'
  | 'first_session'
  | 'five_sessions'
  | 'perfect_day'
  | 'streak_3'
  | 'streak_7'
  | 'hundred_minutes'
  | 'ten_tasks'

// ── User Profile ──────────────────────────────────────
export interface UserProfile {
  id: 'profile'
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null  // YYYY-MM-DD
  totalXP: number
  level: number
}

// ── Favorites ─────────────────────────────────────────
export interface FavoriteQuote {
  id: string
  text: string
  author?: string
  savedAt: string
}

// ── Settings (LocalStorage) ────────────────────────────
export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  reducedMotion: boolean
  soundEnabled: boolean
  tickingEnabled: boolean
  notificationsEnabled: boolean
  musicVolume: number
  focusDuration: number       // minutes
  shortBreakDuration: number
  longBreakDuration: number
  longBreakAfter: number      // sessions
  wakeUpTime: string          // HH:MM
  workStartTime: string       // HH:MM
  availableHours: number
  xpTask: number
  xpSession: number
  xpFirstTask: number
  xpAllTasks: number
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  reducedMotion: false,
  soundEnabled: true,
  tickingEnabled: false,
  notificationsEnabled: false,
  musicVolume: 0.5,
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakAfter: 4,
  wakeUpTime: '07:00',
  workStartTime: '09:00',
  availableHours: 8,
  xpTask: 10,
  xpSession: 25,
  xpFirstTask: 5,
  xpAllTasks: 30,
}

// ── Statistics ────────────────────────────────────────
export interface DailyStat {
  date: string              // YYYY-MM-DD
  focusMinutes: number
  tasksCompleted: number
  sessionsCompleted: number
  xpEarned: number
}

// ── Page names ────────────────────────────────────────
export type PageId =
  | 'dashboard'
  | 'tasks'
  | 'timer'
  | 'alarm'
  | 'music'
  | 'achievements'
  | 'statistics'
  | 'settings'
