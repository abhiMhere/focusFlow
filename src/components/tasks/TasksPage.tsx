import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CheckCircle2, Circle, Pencil, Trash2, Clock, Filter, SortAsc, ChevronDown } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../services/storage/db'
import { awardXP, checkAndAwardAchievements, updateStreak } from '../../services/rewards/rewardsService'
import { incrementStat } from '../../services/storage/db'
import { TaskModal } from './TaskModal'
import type { Task, Priority } from '../../types'
import { todayStr, formatDuration } from '../../utils/helpers'
import { useSettingsStore } from '../../store/settingsStore'
import { ToastContainer, useToast } from '../ui/Toast'

type FilterStatus = 'all' | 'pending' | 'completed'
type SortKey = 'time' | 'priority' | 'created'

const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

export function TasksPage() {
  const today = todayStr()
  const { settings } = useSettingsStore()
  const { toasts, addToast, removeToast } = useToast()

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [sortKey, setSortKey] = useState<SortKey>('time')
  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState<Task | undefined>()
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const tasks = useLiveQuery(() => db.tasks.where('date').equals(today).toArray(), [today])

  const filtered = (tasks ?? [])
    .filter(t => filterStatus === 'all' ? true : t.status === filterStatus)
    .sort((a, b) => {
      if (sortKey === 'time') return (a.plannedStartTime ?? '99:99').localeCompare(b.plannedStartTime ?? '99:99')
      if (sortKey === 'priority') return priorityOrder[a.priority] - priorityOrder[b.priority]
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const totalMinutes = (tasks ?? []).filter(t => t.status === 'pending').reduce((s, t) => s + t.estimatedMinutes, 0)
  const completedCount = (tasks ?? []).filter(t => t.status === 'completed').length
  const totalCount = tasks?.length ?? 0

  const handleToggle = async (task: Task) => {
    const newStatus = task.status === 'pending' ? 'completed' : 'pending'
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : undefined
    await db.tasks.update(task.id, { status: newStatus, completedAt })

    if (newStatus === 'completed') {
      // Check if first task of day
      const todayCompleted = (tasks ?? []).filter(t => t.status === 'completed').length
      if (todayCompleted === 0) {
        await awardXP('task_first_of_day', settings.xpFirstTask, `first_${today}`)
      }
      await awardXP('task_complete', settings.xpTask, task.id)
      await incrementStat(today, 'tasksCompleted')
      await updateStreak()

      // Check all tasks done
      const allNowCompleted = (tasks ?? []).every(t => t.id === task.id ? true : t.status === 'completed')
      if (allNowCompleted && totalCount > 0) {
        await awardXP('all_tasks_complete', settings.xpAllTasks, `allday_${today}`)
        addToast('🎉 All tasks completed! Bonus XP earned!', 'success')
      } else {
        addToast(`+${settings.xpTask} XP earned!`, 'success')
      }

      const newAchievements = await checkAndAwardAchievements()
      newAchievements.forEach(id => addToast(`🏆 Achievement unlocked: ${id.replace(/_/g, ' ')}!`, 'info'))
    }
  }

  const handleDelete = async (id: string) => {
    await db.tasks.delete(id)
    setDeleteConfirm(null)
    addToast('Task deleted', 'info')
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Today's Tasks</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
            {completedCount}/{totalCount} done · {formatDuration(totalMinutes)} remaining
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTask(undefined); setShowModal(true) }}>
          <Plus size={16} /> Add Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div style={{ display: 'flex', gap: 6, background: 'var(--bg-secondary)', padding: 4, borderRadius: 8 }}>
          {(['all', 'pending', 'completed'] as FilterStatus[]).map(f => (
            <button
              key={f}
              className="btn btn-sm"
              style={{
                background: filterStatus === f ? 'var(--bg-card)' : 'transparent',
                color: filterStatus === f ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: filterStatus === f ? 'var(--shadow-sm)' : 'none',
                textTransform: 'capitalize'
              }}
              onClick={() => setFilterStatus(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <SortAsc size={14} style={{ color: 'var(--text-muted)' }} />
          <select
            className="input"
            style={{ width: 'auto', padding: '5px 28px 5px 8px', fontSize: 13 }}
            value={sortKey}
            onChange={e => setSortKey(e.target.value as SortKey)}
          >
            <option value="time">Sort by Time</option>
            <option value="priority">Sort by Priority</option>
            <option value="created">Sort by Created</option>
          </select>
        </div>
      </div>

      {/* Overload warning */}
      {totalMinutes > settings.availableHours * 60 && (
        <div style={{ background: '#fef9e7', border: '1px solid #f5c842', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#92400e' }}
          className="dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300">
          ⚠️ Your pending tasks total <strong>{formatDuration(totalMinutes)}</strong>, which exceeds your
          available {settings.availableHours}h work day. Consider deferring some tasks.
        </div>
      )}

      {/* Task list */}
      {(!tasks || tasks.length === 0) ? (
        <EmptyState onAdd={() => { setEditTask(undefined); setShowModal(true) }} />
      ) : (
        <AnimatePresence>
          <div className="flex flex-col gap-3">
            {filtered.map(task => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <TaskCard
                  task={task}
                  onToggle={() => handleToggle(task)}
                  onEdit={() => { setEditTask(task); setShowModal(true) }}
                  onDelete={() => setDeleteConfirm(task.id)}
                />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: 24, maxWidth: 360 }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>Delete Task?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {showModal && <TaskModal task={editTask} onClose={() => { setShowModal(false); setEditTask(undefined) }} />}
    </div>
  )
}

function TaskCard({ task, onToggle, onEdit, onDelete }: {
  task: Task
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const done = task.status === 'completed'
  return (
    <div
      className="card card-hover"
      style={{ padding: '14px 16px', opacity: done ? 0.75 : 1 }}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          style={{ flexShrink: 0, marginTop: 1, color: done ? 'var(--accent)' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          aria-label={done ? 'Mark incomplete' : 'Mark complete'}
        >
          {done
            ? <CheckCircle2 size={20} />
            : <Circle size={20} />
          }
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 600, fontSize: 15, color: 'var(--text-primary)',
            textDecoration: done ? 'line-through' : 'none',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {task.title}
          </div>
          {task.description && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.description}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className={`badge badge-${task.priority}`}>{task.priority}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Clock size={11} /> {formatDuration(task.estimatedMinutes)}
            </span>
            {task.plannedStartTime && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>@ {task.plannedStartTime}</span>
            )}
            {task.category && (
              <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 999, background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                {task.category}
              </span>
            )}
            {task.deadline && (
              <span style={{ fontSize: 11, color: 'var(--warning)' }}>due {task.deadline}</span>
            )}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button className="btn btn-ghost btn-icon-sm" onClick={onEdit} aria-label="Edit task">
            <Pencil size={14} />
          </button>
          <button className="btn btn-ghost btn-icon-sm" onClick={onDelete} aria-label="Delete task"
            style={{ color: 'var(--danger)' }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
      <CheckCircle2 size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
      <h3 style={{ margin: '0 0 8px', color: 'var(--text-secondary)', fontWeight: 600 }}>No tasks today</h3>
      <p style={{ margin: '0 0 20px', fontSize: 14 }}>Add tasks to plan your day and track progress.</p>
      <button className="btn btn-primary" onClick={onAdd}>
        <Plus size={15} /> Add your first task
      </button>
    </div>
  )
}
