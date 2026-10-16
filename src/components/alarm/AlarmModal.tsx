import React, { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { db } from '../../services/storage/db'
import { generateId } from '../../utils/helpers'
import type { Alarm, DayOfWeek } from '../../types'
import { motion } from 'framer-motion'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface AlarmModalProps {
  alarm?: Alarm
  onClose: () => void
}

export function AlarmModal({ alarm, onClose }: AlarmModalProps) {
  const [time, setTime] = useState(alarm?.time ?? '07:00')
  const [label, setLabel] = useState(alarm?.label ?? '')
  const [days, setDays] = useState<DayOfWeek[]>(alarm?.days ?? [])
  const [snoozeMinutes, setSnoozeMinutes] = useState(alarm?.snoozeMinutes ?? 5)
  const [puzzleEnabled, setPuzzleEnabled] = useState(alarm?.puzzleEnabled ?? false)
  const [puzzleType, setPuzzleType] = useState<'math' | 'wordsearch'>(alarm?.puzzleType ?? 'math')
  const [puzzleDifficulty, setPuzzleDifficulty] = useState<'easy' | 'medium' | 'hard'>(alarm?.puzzleDifficulty ?? 'easy')
  const [briefingEnabled, setBriefingEnabled] = useState(alarm?.briefingEnabled ?? false)
  const [volume, setVolume] = useState(alarm?.volume ?? 0.8)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const toggleDay = (d: DayOfWeek) => {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!time) { setError('Time is required'); return }
    setSaving(true)
    try {
      const data: Alarm = {
        id: alarm?.id ?? generateId(),
        enabled: alarm?.enabled ?? true,
        time, label: label.trim() || undefined,
        days, snoozeMinutes, puzzleEnabled, puzzleType, puzzleDifficulty,
        briefingEnabled, volume,
      }
      await db.alarms.put(data)
      onClose()
    } catch {
      setError('Failed to save alarm.')
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="alarm-modal-title">
      <motion.div className="modal-content" style={{ padding: 24 }}
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="flex items-center justify-between mb-5">
          <h2 id="alarm-modal-title" style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            {alarm ? 'Edit Alarm' : 'New Alarm'}
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="alarm-time">Alarm Time</label>
            <input id="alarm-time" type="time" className="input" value={time}
              onChange={e => setTime(e.target.value)} required style={{ fontSize: 20, fontFamily: 'var(--font-mono)' }} />
          </div>
          <div>
            <label className="label" htmlFor="alarm-label">Label (optional)</label>
            <input id="alarm-label" className="input" value={label}
              onChange={e => setLabel(e.target.value)} placeholder="Morning routine" maxLength={60} />
          </div>
          <div>
            <label className="label">Repeat Days (empty = every day)</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DAY_NAMES.map((name, i) => (
                <button
                  key={i} type="button"
                  className="btn btn-sm"
                  style={{
                    background: days.includes(i as DayOfWeek) ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: days.includes(i as DayOfWeek) ? 'white' : 'var(--text-secondary)',
                    minWidth: 44
                  }}
                  onClick={() => toggleDay(i as DayOfWeek)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label" htmlFor="alarm-snooze">Snooze (0 = off)</label>
              <select id="alarm-snooze" className="input" value={snoozeMinutes}
                onChange={e => setSnoozeMinutes(Number(e.target.value))}>
                <option value={0}>No snooze</option>
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="alarm-volume">Volume</label>
              <input id="alarm-volume" type="range" min={0} max={1} step={0.1} value={volume}
                onChange={e => setVolume(Number(e.target.value))} style={{ width: '100%', marginTop: 8 }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label className="label" style={{ margin: 0 }}>Puzzle Challenge</label>
              <label className="toggle">
                <input type="checkbox" checked={puzzleEnabled} onChange={e => setPuzzleEnabled(e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>
            {puzzleEnabled && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="label" htmlFor="puzzle-type">Type</label>
                  <select id="puzzle-type" className="input" value={puzzleType}
                    onChange={e => setPuzzleType(e.target.value as 'math' | 'wordsearch')}>
                    <option value="math">Math Challenge</option>
                    <option value="wordsearch">Word Search</option>
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="puzzle-diff">Difficulty</label>
                  <select id="puzzle-diff" className="input" value={puzzleDifficulty}
                    onChange={e => setPuzzleDifficulty(e.target.value as 'easy'|'medium'|'hard')}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label className="label" style={{ margin: 0 }}>Morning Briefing</label>
            <label className="toggle">
              <input type="checkbox" checked={briefingEnabled} onChange={e => setBriefingEnabled(e.target.checked)} />
              <span className="toggle-slider" />
            </label>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)', fontSize: 13 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : alarm ? 'Save Changes' : 'Create Alarm'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
