import type { AppSettings } from '../../types'
import { DEFAULT_SETTINGS } from '../../types'

const KEY = 'focusflow_settings'
const TIMER_KEY = 'focusflow_timer'

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(s: AppSettings) {
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* storage full */ }
}

// Timer persistence
export interface PersistedTimer {
  isRunning: boolean
  sessionType: string
  targetEndTime: number | null
  pausedRemaining: number | null
  focusCount: number
  associatedTaskId?: string
  sessionId?: string
}

export function saveTimerState(t: PersistedTimer) {
  try { localStorage.setItem(TIMER_KEY, JSON.stringify(t)) } catch { }
}

export function loadTimerState(): PersistedTimer | null {
  try {
    const raw = localStorage.getItem(TIMER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function clearTimerState() {
  localStorage.removeItem(TIMER_KEY)
}
