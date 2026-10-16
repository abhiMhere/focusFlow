import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlarmClock, X } from 'lucide-react'
import type { Alarm } from '../../types'
import { MathPuzzle } from '../puzzles/MathPuzzle'
import { WordSearchPuzzle } from '../puzzles/WordSearchPuzzle'
import { MorningBriefing } from './MorningBriefing'
import { formatTime } from '../../utils/helpers'

interface AlarmRingingProps {
  alarm: Alarm
  onDismiss: () => void
}

export function AlarmRinging({ alarm, onDismiss }: AlarmRingingProps) {
  const [now, setNow] = useState(() => formatTime(new Date()))
  const [puzzleSolved, setPuzzleSolved] = useState(!alarm.puzzleEnabled)
  const [showBriefing, setShowBriefing] = useState(false)
  const [snoozed, setSnoozed] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setNow(formatTime(new Date())), 1000)
    return () => clearInterval(id)
  }, [])

  const handleSnooze = () => {
    setSnoozed(true)
    setTimeout(() => {
      setSnoozed(false)
    }, alarm.snoozeMinutes * 60 * 1000)
    // Just visually dismiss for snooze
    onDismiss()
  }

  if (showBriefing) {
    return <MorningBriefing onClose={() => { setShowBriefing(false); onDismiss() }} />
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'var(--bg-primary)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 24, padding: 24
      }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alarm-ringing-title"
    >
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <AlarmClock size={64} style={{ color: 'var(--accent)' }} />
      </motion.div>

      <h1 id="alarm-ringing-title" style={{ fontSize: 64, fontWeight: 700, fontFamily: 'var(--font-mono)', margin: 0, color: 'var(--text-primary)' }}>
        {now}
      </h1>

      {alarm.label && (
        <p style={{ fontSize: 20, color: 'var(--text-secondary)', margin: 0 }}>{alarm.label}</p>
      )}

      {/* Puzzle */}
      {alarm.puzzleEnabled && !puzzleSolved && (
        <div style={{ width: '100%', maxWidth: 420 }}>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 16 }}>
            Solve the puzzle to dismiss the alarm
          </p>
          {alarm.puzzleType === 'math' ? (
            <MathPuzzle difficulty={alarm.puzzleDifficulty} onSolved={() => setPuzzleSolved(true)} />
          ) : (
            <WordSearchPuzzle difficulty={alarm.puzzleDifficulty} onSolved={() => setPuzzleSolved(true)} />
          )}
        </div>
      )}

      {/* Controls */}
      {puzzleSolved && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {alarm.briefingEnabled && (
            <button className="btn btn-secondary btn-lg" onClick={() => setShowBriefing(true)}>
              Morning Briefing
            </button>
          )}
          {alarm.snoozeMinutes > 0 && (
            <button className="btn btn-secondary btn-lg" onClick={handleSnooze}>
              Snooze {alarm.snoozeMinutes}m
            </button>
          )}
          <button className="btn btn-primary btn-lg" onClick={onDismiss} style={{ minWidth: 140 }}>
            <X size={18} /> Dismiss
          </button>
        </div>
      )}
    </motion.div>
  )
}
