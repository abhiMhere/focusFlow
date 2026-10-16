import React from 'react'
import { motion } from 'framer-motion'
import { X, Play, CheckCircle2, Clock, Star } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../services/storage/db'
import { useNavStore } from '../../store/navStore'
import { getDailyQuote, getDailyIdea } from '../../data/content'
import { todayStr, formatDateLong, formatDuration, getGreeting, timeStrAdd } from '../../utils/helpers'
import { useSettingsStore } from '../../store/settingsStore'

interface MorningBriefingProps {
  onClose: () => void
}

export function MorningBriefing({ onClose }: MorningBriefingProps) {
  const today = todayStr()
  const { settings } = useSettingsStore()
  const { navigate } = useNavStore()
  const quote = getDailyQuote(today)
  const idea = getDailyIdea(today)

  const tasks = useLiveQuery(() => db.tasks.where('date').equals(today).toArray(), [today])

  const pendingTasks = tasks?.filter(t => t.status === 'pending') ?? []
  const highPriority = pendingTasks.filter(t => t.priority === 'high')
  const totalMinutes = pendingTasks.reduce((s, t) => s + t.estimatedMinutes, 0)

  // Build suggested schedule
  let currentTime = settings.workStartTime
  const scheduled = pendingTasks
    .sort((a, b) => (a.plannedStartTime ?? '99:99').localeCompare(b.plannedStartTime ?? '99:99'))
    .map(t => {
      const start = t.plannedStartTime ?? currentTime
      currentTime = timeStrAdd(start, t.estimatedMinutes)
      return { ...t, suggestedStart: start, suggestedEnd: currentTime }
    })

  const handleStart = () => {
    onClose()
    navigate('timer')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'var(--bg-primary)', overflowY: 'auto',
        padding: 24
      }}
    >
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
              {getGreeting()} 🌅
            </h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>{formatDateLong(today)}</p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Summary card */}
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Planned tasks</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{pendingTasks.length}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total work time</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{formatDuration(totalMinutes)}</div>
            </div>
          </div>
          {totalMinutes > settings.availableHours * 60 && (
            <p style={{ fontSize: 12, color: 'var(--warning)', marginTop: 10 }}>
              ⚠️ Planned work exceeds {settings.availableHours}h. Consider deferring some tasks.
            </p>
          )}
        </div>

        {/* High priority */}
        {highPriority.length > 0 && (
          <div className="card" style={{ padding: 20, marginBottom: 20, borderLeft: '3px solid var(--danger)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
              High Priority
            </div>
            {highPriority.map(t => (
              <div key={t.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <Star size={13} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>{formatDuration(t.estimatedMinutes)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Task schedule */}
        {scheduled.length > 0 ? (
          <div className="card" style={{ padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Today's Schedule
            </div>
            <div className="flex flex-col gap-3">
              {scheduled.map((t, i) => (
                <div key={t.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', width: 50, flexShrink: 0, paddingTop: 2 }}>
                    {t.suggestedStart}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{t.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 6, marginTop: 2 }}>
                      <Clock size={11} /> {formatDuration(t.estimatedMinutes)}
                      <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 20, marginBottom: 20, textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>No tasks planned. Add some tasks to build your day!</p>
          </div>
        )}

        {/* Quote */}
        <div className="card" style={{ padding: 20, marginBottom: 20, borderLeft: '3px solid var(--accent)' }}>
          <p style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--text-primary)', margin: 0 }}>"{quote.text}"</p>
          {quote.author && <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '6px 0 0' }}>— {quote.author}</p>}
        </div>

        {/* Idea */}
        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: 4 }}>
            Today's Idea
          </div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{idea.title}</div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>{idea.description}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button className="btn btn-primary btn-lg" onClick={handleStart}>
            <Play size={17} /> Start Focus Session
          </button>
          <button className="btn btn-secondary btn-lg" onClick={onClose}>
            <CheckCircle2 size={17} /> Got It
          </button>
        </div>
      </div>
    </motion.div>
  )
}
