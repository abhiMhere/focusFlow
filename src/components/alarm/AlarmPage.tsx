import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Bell, BellOff, Trash2, AlarmClock, Info } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../services/storage/db'
import { generateId, msUntilTime } from '../../utils/helpers'
import type { Alarm, DayOfWeek } from '../../types'
import { AlarmModal } from './AlarmModal'
import { AlarmRinging } from './AlarmRinging'
import { playAlarmBuzzer } from '../../services/audio/audioManager'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function AlarmPage() {
  const alarms = useLiveQuery(() => db.alarms.toArray(), [])
  const [showModal, setShowModal] = useState(false)
  const [editAlarm, setEditAlarm] = useState<Alarm | undefined>()
  const [ringingAlarm, setRingingAlarm] = useState<Alarm | null>(null)
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const stopBuzzerRef = useRef<(() => void) | null>(null)

  // Schedule alarms
  useEffect(() => {
    if (!alarms) return
    // Clear existing timers
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current.clear()

    alarms.filter(a => a.enabled).forEach(alarm => {
      const now = new Date()
      const today = now.getDay() as DayOfWeek
      const shouldRingToday = alarm.days.length === 0 || alarm.days.includes(today)
      if (!shouldRingToday) return

      const ms = msUntilTime(alarm.time)
      // Only schedule if within 24h (and not already past for today)
      if (ms > 0 && ms < 24 * 60 * 60 * 1000) {
        const timer = setTimeout(() => {
          stopBuzzerRef.current = playAlarmBuzzer()
          setRingingAlarm(alarm)
        }, ms)
        timersRef.current.set(alarm.id, timer)
      }
    })

    return () => { timersRef.current.forEach(t => clearTimeout(t)) }
  }, [alarms])

  const handleDismiss = () => {
    stopBuzzerRef.current?.()
    stopBuzzerRef.current = null
    setRingingAlarm(null)
  }

  const toggleAlarm = async (alarm: Alarm) => {
    await db.alarms.update(alarm.id, { enabled: !alarm.enabled })
  }

  const deleteAlarm = async (id: string) => {
    await db.alarms.delete(id)
    const timer = timersRef.current.get(id)
    if (timer) { clearTimeout(timer); timersRef.current.delete(id) }
  }

  const getNextRingText = (alarm: Alarm): string => {
    if (!alarm.enabled) return 'Disabled'
    const now = new Date()
    const today = now.getDay() as DayOfWeek
    const shouldRingToday = alarm.days.length === 0 || alarm.days.includes(today)
    const ms = msUntilTime(alarm.time)
    if (shouldRingToday && ms < 24 * 60 * 60 * 1000) {
      const h = Math.floor(ms / 3600000)
      const m = Math.floor((ms % 3600000) / 60000)
      return `Rings in ${h > 0 ? `${h}h ` : ''}${m}m`
    }
    return 'Tomorrow'
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Alarm</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
            {alarms?.filter(a => a.enabled).length ?? 0} alarm(s) active
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditAlarm(undefined); setShowModal(true) }}>
          <Plus size={15} /> Add Alarm
        </button>
      </div>

      {/* Reliability notice */}
      <div style={{
        padding: '12px 16px', borderRadius: 10, fontSize: 12, color: 'var(--text-muted)',
        background: 'var(--bg-secondary)', border: '1px solid var(--border)', marginBottom: 20,
        display: 'flex', gap: 8, alignItems: 'flex-start'
      }}>
        <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Alarms only ring while this app is <strong>open in your browser</strong>. They cannot wake a sleeping device
          or fire when the browser is closed. For reliable wake-up alarms, use your device's native clock app.
        </span>
      </div>

      {(!alarms || alarms.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <AlarmClock size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <h3 style={{ margin: '0 0 8px', color: 'var(--text-secondary)', fontWeight: 600 }}>No alarms set</h3>
          <p style={{ margin: '0 0 20px', fontSize: 14 }}>Create an alarm to start your morning routine.</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Add Alarm
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {alarms.map(alarm => (
            <div key={alarm.id} className="card" style={{ padding: '16px 18px' }}>
              <div className="flex items-center gap-4">
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: alarm.enabled ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {alarm.time}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {alarm.label && <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{alarm.label} · </span>}
                    {getNextRingText(alarm)}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                    {alarm.days.length === 0
                      ? <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 999, background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>Every day</span>
                      : alarm.days.map((d: DayOfWeek) => (
                        <span key={d} style={{ fontSize: 11, padding: '1px 7px', borderRadius: 999, background: 'var(--accent)', color: 'white' }}>
                          {DAY_NAMES[d]}
                        </span>
                      ))
                    }
                    {alarm.puzzleEnabled && (
                      <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 999, background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                        {alarm.puzzleType === 'math' ? '🧮' : '🔠'} puzzle
                      </span>
                    )}
                    {alarm.snoozeMinutes > 0 && (
                      <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 999, background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                        Snooze {alarm.snoozeMinutes}m
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="toggle" aria-label={`${alarm.enabled ? 'Disable' : 'Enable'} alarm`}>
                    <input
                      type="checkbox"
                      checked={alarm.enabled}
                      onChange={() => toggleAlarm(alarm)}
                    />
                    <span className="toggle-slider" />
                  </label>
                  <button
                    className="btn btn-ghost btn-icon-sm"
                    onClick={() => { setEditAlarm(alarm); setShowModal(true) }}
                    aria-label="Edit alarm"
                  >
                    <Bell size={14} />
                  </button>
                  <button
                    className="btn btn-ghost btn-icon-sm"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => deleteAlarm(alarm.id)}
                    aria-label="Delete alarm"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AlarmModal
          alarm={editAlarm}
          onClose={() => { setShowModal(false); setEditAlarm(undefined) }}
        />
      )}

      {ringingAlarm && (
        <AlarmRinging alarm={ringingAlarm} onDismiss={handleDismiss} />
      )}
    </div>
  )
}
