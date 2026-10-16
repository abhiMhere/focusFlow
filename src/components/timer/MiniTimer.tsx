import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Play, Pause, RotateCcw, SkipForward, Timer } from 'lucide-react'
import { useTimerStore } from '../../store/timerStore'
import { useSettingsStore } from '../../store/settingsStore'
import { formatCountdown } from '../../utils/helpers'
import { playTick } from '../../services/audio/audioManager'

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function MiniTimer() {
  const store = useTimerStore()
  const { settings } = useSettingsStore()
  const [remaining, setRemaining] = useState(0)
  const rafRef = useRef<number>()

  const totalMs = (
    store.sessionType === 'focus' ? settings.focusDuration :
    store.sessionType === 'shortBreak' ? settings.shortBreakDuration :
    settings.longBreakDuration
  ) * 60 * 1000

  const tick = useCallback(() => {
    const r = store.tick()
    setRemaining(r)
    if (store.isRunning) rafRef.current = requestAnimationFrame(tick)
  }, [store])

  useEffect(() => {
    if (store.isRunning) {
      rafRef.current = requestAnimationFrame(tick)
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      setRemaining(store.pausedRemaining ?? totalMs)
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [store.isRunning, tick, store.pausedRemaining, totalMs])

  const pct = totalMs > 0 ? remaining / totalMs : 1
  const offset = CIRCUMFERENCE * (1 - pct)
  const color = store.sessionType === 'focus' ? 'var(--accent)' : 'var(--accent2)'

  const handleStart = () => {
    const r = store.isRunning ? undefined : (store.pausedRemaining ?? totalMs)
    if (!store.isRunning && store.pausedRemaining !== null) store.resume()
    else if (!store.isRunning) store.start(totalMs)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <svg width={130} height={130} aria-label={`Timer: ${formatCountdown(remaining)} remaining`}>
        <circle className="timer-ring-track" cx={65} cy={65} r={RADIUS} />
        <circle
          className="timer-ring-progress"
          cx={65} cy={65} r={RADIUS}
          stroke={color}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 65 65)"
        />
        <text
          x={65} y={68}
          textAnchor="middle"
          style={{ fill: 'var(--text-primary)', fontSize: 18, fontFamily: 'var(--font-mono)', fontWeight: 700 }}
        >
          {formatCountdown(remaining)}
        </text>
      </svg>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
        {store.sessionType === 'focus' ? 'Focus' : store.sessionType === 'shortBreak' ? 'Short Break' : 'Long Break'}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleStart}
          aria-label={store.isRunning ? 'Pause' : 'Start'}
        >
          {store.isRunning ? <Pause size={14} /> : <Play size={14} />}
          {store.isRunning ? 'Pause' : store.pausedRemaining !== null ? 'Resume' : 'Start'}
        </button>
        <button
          className="btn btn-secondary btn-icon-sm"
          onClick={() => store.reset(totalMs)}
          aria-label="Reset"
        >
          <RotateCcw size={13} />
        </button>
      </div>
    </div>
  )
}
