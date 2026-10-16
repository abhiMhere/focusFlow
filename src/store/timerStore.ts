import { create } from 'zustand'
import type { SessionType, TimerState } from '../types'
import { saveTimerState, loadTimerState, clearTimerState } from '../services/storage/localStorage'

interface TimerStore extends TimerState {
  // Actions
  start: (durationMs: number) => void
  pause: () => void
  resume: () => void
  reset: (durationMs: number) => void
  skip: () => void
  setSessionType: (type: SessionType) => void
  setAssociatedTask: (taskId: string | undefined) => void
  tick: () => number   // returns remaining ms
  markCompleted: (sessionId: string) => void
  incrementFocusCount: () => void
  restoreFromStorage: () => void
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  isRunning: false,
  sessionType: 'focus',
  targetEndTime: null,
  pausedRemaining: null,
  focusCount: 0,
  associatedTaskId: undefined,
  sessionId: undefined,
  completedSessionId: undefined,

  start(durationMs: number) {
    const targetEndTime = Date.now() + durationMs
    const { sessionType, associatedTaskId } = get()
    const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`
    set({ isRunning: true, targetEndTime, pausedRemaining: null, sessionId })
    saveTimerState({ isRunning: true, sessionType, targetEndTime, pausedRemaining: null, focusCount: get().focusCount, associatedTaskId, sessionId })
  },

  pause() {
    const { targetEndTime } = get()
    if (!targetEndTime) return
    const remaining = Math.max(0, targetEndTime - Date.now())
    set({ isRunning: false, pausedRemaining: remaining, targetEndTime: null })
    const s = get()
    saveTimerState({ isRunning: false, sessionType: s.sessionType, targetEndTime: null, pausedRemaining: remaining, focusCount: s.focusCount, associatedTaskId: s.associatedTaskId, sessionId: s.sessionId })
  },

  resume() {
    const { pausedRemaining } = get()
    if (pausedRemaining === null) return
    const targetEndTime = Date.now() + pausedRemaining
    set({ isRunning: true, targetEndTime, pausedRemaining: null })
    const s = get()
    saveTimerState({ isRunning: true, sessionType: s.sessionType, targetEndTime, pausedRemaining: null, focusCount: s.focusCount, associatedTaskId: s.associatedTaskId, sessionId: s.sessionId })
  },

  reset(durationMs: number) {
    set({ isRunning: false, targetEndTime: null, pausedRemaining: durationMs, sessionId: undefined })
    const s = get()
    saveTimerState({ isRunning: false, sessionType: s.sessionType, targetEndTime: null, pausedRemaining: durationMs, focusCount: s.focusCount, associatedTaskId: s.associatedTaskId })
  },

  skip() {
    set({ isRunning: false, targetEndTime: null, pausedRemaining: null, sessionId: undefined })
    clearTimerState()
  },

  setSessionType(type: SessionType) {
    set({ sessionType: type, isRunning: false, targetEndTime: null, pausedRemaining: null, sessionId: undefined })
  },

  setAssociatedTask(taskId) {
    set({ associatedTaskId: taskId })
  },

  tick() {
    const { targetEndTime, pausedRemaining } = get()
    if (!targetEndTime) return pausedRemaining ?? 0
    return Math.max(0, targetEndTime - Date.now())
  },

  markCompleted(sessionId: string) {
    set({ completedSessionId: sessionId })
  },

  incrementFocusCount() {
    const next = get().focusCount + 1
    set({ focusCount: next })
    const s = get()
    saveTimerState({ isRunning: s.isRunning, sessionType: s.sessionType, targetEndTime: s.targetEndTime, pausedRemaining: s.pausedRemaining, focusCount: next, associatedTaskId: s.associatedTaskId })
  },

  restoreFromStorage() {
    const stored = loadTimerState()
    if (!stored) return
    set({
      isRunning: stored.isRunning,
      sessionType: stored.sessionType as SessionType,
      targetEndTime: stored.targetEndTime,
      pausedRemaining: stored.pausedRemaining,
      focusCount: stored.focusCount,
      associatedTaskId: stored.associatedTaskId,
      sessionId: stored.sessionId,
    })
  }
}))
