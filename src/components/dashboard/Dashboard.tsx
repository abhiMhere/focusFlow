import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Play, Bell, Zap, Flame, Star, Copy, Heart, ChevronRight, Clock } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getProfile } from '../../services/storage/db'
import { useNavStore } from '../../store/navStore'
import { useSettingsStore } from '../../store/settingsStore'
import { getDailyQuote, getDailyIdea } from '../../data/content'
import {
  todayStr, getGreeting, formatDateLong, formatDuration,
  getLevel, copyToClipboard
} from '../../utils/helpers'
import { TaskModal } from '../tasks/TaskModal'
import { MiniTimer } from '../timer/MiniTimer'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

export function Dashboard() {
  const { navigate } = useNavStore()
  const { settings } = useSettingsStore()
  const today = todayStr()
  const quote = getDailyQuote(today)
  const idea = getDailyIdea(today)

  const [showTaskModal, setShowTaskModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [greeting, setGreeting] = useState(() => getGreeting())

  useEffect(() => {
    const id = setInterval(() => setGreeting(getGreeting()), 60000)
    return () => clearInterval(id)
  }, [])

  const tasks = useLiveQuery(() => db.tasks.where('date').equals(today).toArray(), [today])
  const profile = useLiveQuery(() => getProfile(), [])

  const totalTasks = tasks?.length ?? 0
  const completedTasks = tasks?.filter(t => t.status === 'completed').length ?? 0
  const remainingTasks = totalTasks - completedTasks
  const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const totalMinutes = tasks?.filter(t => t.status === 'pending').reduce((s, t) => s + t.estimatedMinutes, 0) ?? 0

  const nextTask = tasks
    ?.filter(t => t.status === 'pending')
    .sort((a, b) => (a.plannedStartTime ?? '99:99').localeCompare(b.plannedStartTime ?? '99:99'))[0]

  const { level, xpInLevel, xpForNext } = getLevel(profile?.totalXP ?? 0)
  const xpPct = xpForNext > 0 ? Math.round((xpInLevel / xpForNext) * 100) : 0

  const handleCopyQuote = async () => {
    await copyToClipboard(`"${quote.text}"${quote.author ? ` — ${quote.author}` : ''}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-5">

        {/* Header */}
        <motion.div variants={item}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {greeting} 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>
            {formatDateLong(today)}
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          <StatCard label="Tasks Done" value={`${completedTasks}/${totalTasks}`} sub="today" color="var(--accent)" />
          <StatCard label="Remaining" value={remainingTasks} sub="tasks left" color="var(--accent2)" />
          <StatCard label="Est. Time" value={formatDuration(totalMinutes)} sub="remaining" color="var(--text-secondary)" />
          <StatCard label="Streak" value={`${profile?.currentStreak ?? 0}d`} sub="current" color="#ef4444" Icon={Flame} />
        </motion.div>

        {/* Progress bar */}
        {totalTasks > 0 && (
          <motion.div variants={item} className="card" style={{ padding: '16px 20px' }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Today's Progress</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{pct}%</span>
            </div>
            <div className="progress-bar" style={{ height: 8 }}>
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            {totalMinutes > settings.availableHours * 60 && (
              <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 8 }}>
                ⚠️ Your tasks exceed your {settings.availableHours}h work day by {formatDuration(totalMinutes - settings.availableHours * 60)}.
              </p>
            )}
          </motion.div>
        )}

        {/* Main grid: mini timer + next task */}
        <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16 }}>
          {/* Mini Timer */}
          <div className="card" style={{ padding: 20 }}>
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Focus Timer</span>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('timer')}>
                Open <ChevronRight size={13} />
              </button>
            </div>
            <MiniTimer />
          </div>

          {/* Next task */}
          <div className="card" style={{ padding: 20 }}>
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Up Next</span>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('tasks')}>
                All tasks <ChevronRight size={13} />
              </button>
            </div>
            {nextTask ? (
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{nextTask.title}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className={`badge badge-${nextTask.priority}`}>{nextTask.priority}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Clock size={11} /> {formatDuration(nextTask.estimatedMinutes)}
                  </span>
                  {nextTask.plannedStartTime && (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>@ {nextTask.plannedStartTime}</span>
                  )}
                </div>
              </div>
            ) : (
              <EmptyNextTask onAdd={() => setShowTaskModal(true)} />
            )}
          </div>
        </motion.div>

        {/* Quote */}
        <motion.div variants={item} className="card" style={{ padding: 20, borderLeft: '3px solid var(--accent)' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
                "{quote.text}"
              </p>
              {quote.author && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>— {quote.author}</p>
              )}
            </div>
            <button className="btn btn-ghost btn-icon-sm flex-shrink-0" onClick={handleCopyQuote} aria-label="Copy quote">
              {copied ? <Star size={16} style={{ color: 'var(--accent)' }} /> : <Copy size={16} />}
            </button>
          </div>
        </motion.div>

        {/* Productivity idea */}
        <motion.div variants={item} className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: 6 }}>
            Today's Idea
          </div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{idea.title}</div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{idea.description}</p>
        </motion.div>

        {/* XP progress */}
        {profile && (
          <motion.div variants={item} className="card" style={{ padding: 20 }}>
            <div className="flex items-center gap-3 mb-3">
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={18} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Level {level}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{profile.totalXP} XP total</div>
              </div>
              <div className="ml-auto text-right">
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('achievements')}>
                  Achievements <ChevronRight size={13} />
                </button>
              </div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${xpPct}%` }} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              {xpInLevel} / {xpForNext} XP to level {level + 1}
            </div>
          </motion.div>
        )}

        {/* Quick actions */}
        <motion.div variants={item} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingBottom: 24 }}>
          <button className="btn btn-primary btn-lg" onClick={() => setShowTaskModal(true)}>
            <Plus size={17} /> Add Task
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => navigate('timer')}>
            <Play size={17} /> Start Focus
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => navigate('alarm')}>
            <Bell size={17} /> Set Alarm
          </button>
        </motion.div>

      </motion.div>

      {showTaskModal && <TaskModal onClose={() => setShowTaskModal(false)} />}
    </div>
  )
}

function StatCard({
  label, value, sub, color, Icon
}: {
  label: string; value: string | number; sub: string; color: string; Icon?: React.ElementType
}) {
  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
        {Icon && <Icon size={12} color={color} />}
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  )
}

function EmptyNextTask({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>No tasks planned yet</p>
      <button className="btn btn-primary btn-sm" onClick={onAdd}>
        <Plus size={13} /> Add a task
      </button>
    </div>
  )
}
