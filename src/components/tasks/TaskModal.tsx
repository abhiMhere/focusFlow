import React, { useState } from 'react'
import { X, Calendar, Clock, AlertCircle } from 'lucide-react'
import { db } from '../../services/storage/db'
import { generateId, todayStr } from '../../utils/helpers'
import type { Task, Priority } from '../../types'
import { motion } from 'framer-motion'

interface TaskModalProps {
  task?: Task
  onClose: () => void
}

export function TaskModal({ task, onClose }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [estimatedMinutes, setEstimatedMinutes] = useState(task?.estimatedMinutes ?? 25)
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium')
  const [plannedStartTime, setPlannedStartTime] = useState(task?.plannedStartTime ?? '')
  const [deadline, setDeadline] = useState(task?.deadline ?? '')
  const [category, setCategory] = useState(task?.category ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    if (estimatedMinutes < 1 || estimatedMinutes > 480) { setError('Duration must be 1–480 minutes'); return }
    setSaving(true)
    try {
      if (task) {
        await db.tasks.put({
          ...task, title: title.trim(), description: description.trim() || undefined,
          estimatedMinutes, priority, plannedStartTime: plannedStartTime || undefined,
          deadline: deadline || undefined, category: category.trim() || undefined,
        })
      } else {
        const today = todayStr()
        const newTask: Task = {
          id: generateId(),
          title: title.trim(),
          description: description.trim() || undefined,
          estimatedMinutes,
          priority,
          plannedStartTime: plannedStartTime || undefined,
          deadline: deadline || undefined,
          status: 'pending',
          category: category.trim() || undefined,
          createdAt: new Date().toISOString(),
          date: today,
        }
        await db.tasks.add(newTask)
      }
      onClose()
    } catch (err) {
      setError('Failed to save task. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
      <motion.div
        className="modal-content"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{ padding: 24 }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 id="task-modal-title" style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            {task ? 'Edit Task' : 'Add Task'}
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="task-title">Title *</label>
            <input
              id="task-title"
              className="input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              maxLength={200}
            />
          </div>

          <div>
            <label className="label" htmlFor="task-desc">Description</label>
            <textarea
              id="task-desc"
              className="input"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional details..."
              rows={2}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label" htmlFor="task-duration">
                <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                Duration (min)
              </label>
              <input
                id="task-duration"
                type="number"
                className="input"
                value={estimatedMinutes}
                onChange={e => setEstimatedMinutes(Number(e.target.value))}
                min={1}
                max={480}
              />
            </div>
            <div>
              <label className="label" htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                className="input"
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label" htmlFor="task-start">Start Time</label>
              <input
                id="task-start"
                type="time"
                className="input"
                value={plannedStartTime}
                onChange={e => setPlannedStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="task-deadline">
                <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
                Deadline
              </label>
              <input
                id="task-deadline"
                type="date"
                className="input"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="task-category">Category</label>
            <input
              id="task-category"
              className="input"
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="e.g. Work, Personal, Health"
              maxLength={50}
            />
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)', fontSize: 13 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : task ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
