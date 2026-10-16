import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, SkipForward, Coffee, Brain, ListTodo, Zap } from 'lucide-react'
import { useTimerStore } from '../../store/timerStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../services/storage/db'
import {
  formatCountdown, todayStr, formatDuration, generateId
} from '../../utils/helpers'
import { playCompletionChime, playTick, resumeAudioContext } from '../../services/audio/audioManager'
import { sendNotification } from '../../services/notifications/notificationService'
import { awardXP, checkAndAwardAchievements, updateStreak } from '../../services/rewards/rewardsService'
import { incrementStat } from '../../services/storage/db'
import { useSettingsStore as useSettings } from '../../store/settingsStore'
import type { PomodoroSession, SessionType } from '../../types'
import { ToastContainer, useToast } from '../ui/Toast'

const RADIUS = 90
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const SESSION_LABELS: Record<SessionType, string> = {
  focus: 'Focus Session',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
}

const SESSION_COLORS: Record<SessionType, string> = {
  focus: 'var(--accent)',
  shortBreak: 'var(--accent2)',
  longBreak: '#9b8fd9',
}

const SESSION_ICONS: Record<SessionType, React.ElementType> = {
  focus: Brain,
  shortBreak: Coffee,
  longBreak: Coffee,
}

export function TimerPage() {
  const store = useTimerStore()
  const { settings } = useSettings()
  const today = todayStr()
  const { toasts, addToast, removeToast } = useToast()

  const [remaining, setRemaining] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const rafRef = useRef<number | undefined>(undefined)
  const completedRef = useRef<Set<string>>(new Set())
  const tickCountRef = useRef(0)
  const lastTickRef = useRef(0)

  const tasks = useLiveQuery(() => db.tasks.where('date').equals(today).filter(t => t.status === 'pending').toArray(), [today])
  const sessions = useLiveQuery(() => db.sessions.where('date').equals(today).toArray(), [today])

  const getDurationMs = useCallback((type: SessionType) => (
    type === 'focus' ? settings.focusDuration :
    type === 'shortBreak' ? settings.shortBreakDuration :
    settings.longBreakDuration
  ) * 60 * 1000, [settings])

  const totalMs = getDurationMs(store.sessionType)

  // Handle session completion
  const handleComplete = useCallback(async (sessionId: string, type: SessionType) => {
    if (completedRef.current.has(sessionId)) return
    completedRef.current.add(sessionId)

    if (settings.soundEnabled) playCompletionChime()
    if (settings.notificationsEnabled) {
      sendNotification(type === 'focus' ? 'Focus session complete! 🎉' : 'Break time over!', {
        body: type === 'focus' ? 'Take a well-deserved break.' : 'Ready to focus again?',
      })
    }

    if (type === 'focus') {
      const durationMinutes = settings.focusDuration
      const sess: PomodoroSession = {
        id: sessionId,
        taskId: store.associatedTaskId,
        type: 'focus',
        durationMinutes,
        startedAt: new Date(Date.now() - durationMinutes * 60 * 1000).toISOString(),
        completedAt: new Date().toISOString(),
        xpAwarded: true,
        date: today,
      }
      await db.sessions.put(sess)
      await awardXP('session_complete', settings.xpSession, sessionId)
      await incrementStat(today, 'focusMinutes', durationMinutes)
      await incrementStat(today, 'sessionsCompleted')
      await updateStreak()

      store.incrementFocusCount()
      store.markCompleted(sessionId)

      const newAch = await checkAndAwardAchievements()
      newAch.forEach(id => addToast(`🏆 Achievement: ${id.replace(/_/g, ' ')}!`, 'info'))
      addToast(`+${settings.xpSession} XP! Focus session complete!`, 'success')
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)

      // Auto-switch to break
      const isLongBreak = (store.focusCount + 1) % settings.longBreakAfter === 0
      const nextType: SessionType = isLongBreak ? 'longBreak' : 'shortBreak'
      store.setSessionType(nextType)
      store.reset(getDurationMs(nextType))
    } else {
      store.setSessionType('focus')
      store.reset(getDurationMs('focus'))
    }
  }, [settings, store, today, getDurationMs, addToast])

  // RAF-based tick loop
  const tick = useCallback(() => {
    const r = store.tick()
    setRemaining(r)

    // Ticking sound – only once per second
    const now = Date.now()
    if (settings.tickingEnabled && store.isRunning && now - lastTickRef.current > 999) {
      playTick()
      lastTickRef.current = now
    }

    if (r <= 0 && store.isRunning && store.sessionId) {
      handleComplete(store.sessionId, store.sessionType)
    }

    if (store.isRunning) rafRef.current = requestAnimationFrame(tick)
  }, [store, settings.tickingEnabled, handleComplete])

  useEffect(() => {
    if (store.isRunning) {
      rafRef.current = requestAnimationFrame(tick)
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      setRemaining(store.pausedRemaining ?? totalMs)
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [store.isRunning, tick, store.pausedRemaining, totalMs])

  // Restore from storage on mount
  useEffect(() => {
    store.restoreFromStorage()
  }, [])

  // Handle page visibility change
  useEffect(() => {
    const handler = () => {
      if (!document.hidden && store.isRunning) {
        const r = store.tick()
        if (r <= 0 && store.sessionId) {
          handleComplete(store.sessionId, store.sessionType)
        }
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [store, handleComplete])

  const pct = totalMs > 0 ? remaining / totalMs : 1
  const offset = CIRCUMFERENCE * (1 - pct)
  const color = SESSION_COLORS[store.sessionType]
  const Icon = SESSION_ICONS[store.sessionType]

  const focusSessions = sessions?.filter(s => s.type === 'focus') ?? []
  const totalFocusMinutes = focusSessions.reduce((s, x) => s + x.durationMinutes, 0)

  const handleStart = () => {
    resumeAudioContext()
    if (store.isRunning) {
      store.pause()
    } else if (store.pausedRemaining !== null) {
      store.resume()
    } else {
      store.start(totalMs)
    }
  }

  const handleReset = () => store.reset(totalMs)

  const handleSkip = () => {
    store.skip()
    const nextType: SessionType =
      store.sessionType === 'focus'
        ? ((store.focusCount + 1) % settings.longBreakAfter === 0 ? 'longBreak' : 'shortBreak')
        : 'focus'
    store.setSessionType(nextType)
    store.reset(getDurationMs(nextType))
  }

  const handleSetType = (t: SessionType) => {
    store.setSessionType(t)
    store.reset(getDurationMs(t))
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>Focus Timer</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 24px' }}>
        Stay on task. Notifications and ticking sounds available when the app is open.
      </p>

      {/* Session type selector */}
      <div style={{ display: 'flex', gap: 8, background: 'var(--bg-secondary)', padding: 5, borderRadius: 10, marginBottom: 32 }}>
        {(['focus', 'shortBreak', 'longBreak'] as SessionType[]).map(t => (
          <button
            key={t}
            className="btn btn-sm"
            style={{
              flex: 1,
              background: store.sessionType === t ? 'var(--bg-card)' : 'transparent',
              color: store.sessionType === t ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: store.sessionType === t ? 'var(--shadow-sm)' : 'none',
              fontWeight: store.sessionType === t ? 600 : 400,
            }}
            onClick={() => handleSetType(t)}
          >
            {t === 'focus' ? 'Focus' : t === 'shortBreak' ? 'Short Break' : 'Long Break'}
          </button>
        ))}
      </div>

      {/* Large timer ring */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <div style={{ position: 'relative' }}>
          <svg width={220} height={220}
            aria-label={`${SESSION_LABELS[store.sessionType]}: ${formatCountdown(remaining)} remaining`}
            role="timer"
          >
            <circle className="timer-ring-track" cx={110} cy={110} r={RADIUS} />
            <circle
              className="timer-ring-progress"
              cx={110} cy={110} r={RADIUS}
              stroke={color}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              transform="rotate(-90 110 110)"
            />
          </svg>
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <Icon size={22} style={{ color, marginBottom: 4 }} />
            <div style={{ fontSize: 38, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', lineHeight: 1 }}>
              {formatCountdown(remaining)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              {SESSION_LABELS[store.sessionType]}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32 }}>
        <button className="btn btn-secondary btn-icon" onClick={handleReset} aria-label="Reset">
          <RotateCcw size={18} />
        </button>
        <button
          className="btn btn-primary btn-lg"
          style={{ minWidth: 120, background: color }}
          onClick={handleStart}
        >
          {store.isRunning
            ? <><Pause size={18} /> Pause</>
            : store.pausedRemaining !== null
            ? <><Play size={18} /> Resume</>
            : <><Play size={18} /> Start</>
          }
        </button>
        <button className="btn btn-secondary btn-icon" onClick={handleSkip} aria-label="Skip session">
          <SkipForward size={18} />
        </button>
      </div>

      {/* Task association */}
      {tasks && tasks.length > 0 && (
        <div className="card" style={{ padding: '14px 16px', marginBottom: 20 }}>
          <label className="label" htmlFor="timer-task">Link to Task</label>
          <select
            id="timer-task"
            className="input"
            value={store.associatedTaskId ?? ''}
            onChange={e => store.setAssociatedTask(e.target.value || undefined)}
          >
            <option value="">— No task —</option>
            {tasks.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div className="card" style={{ padding: '12px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>{focusSessions.length}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sessions</div>
        </div>
        <div className="card" style={{ padding: '12px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>{formatDuration(totalFocusMinutes)}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Focus time</div>
        </div>
        <div className="card" style={{ padding: '12px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>{store.focusCount}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>This cycle</div>
        </div>
      </div>

      {/* Session history */}
      {focusSessions.length > 0 && (
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>Today's Sessions</div>
          <div className="flex flex-col gap-2">
            {focusSessions.slice(-8).reverse().map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <Zap size={13} style={{ color: 'var(--accent)' }} />
                <span style={{ color: 'var(--text-primary)' }}>Focus — {formatDuration(s.durationMinutes)}</span>
                <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', fontSize: 12 }}>
                  {new Date(s.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reliability notice */}
      <div style={{
        marginTop: 20, padding: '12px 16px', borderRadius: 10, fontSize: 12, color: 'var(--text-muted)',
        background: 'var(--bg-secondary)', border: '1px solid var(--border)'
      }}>
        ℹ️ The timer runs while this page is open. Sound and notifications may not work when the browser is minimized or the device is asleep. For reliable wake-up alarms, a native app is required.
      </div>

      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              background: 'var(--bg-card)', border: '2px solid var(--accent)',
              borderRadius: 20, padding: '28px 40px', textAlign: 'center', zIndex: 60,
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Session Complete!</div>
            <div style={{ color: 'var(--accent)', marginTop: 4 }}>+{settings.xpSession} XP earned</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
