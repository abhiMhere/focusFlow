import Dexie, { type Table } from 'dexie'
import type {
  Task, PomodoroSession, Alarm, XPEvent, Achievement,
  UserProfile, FavoriteQuote, DailyStat
} from '../../types'

import { notifyDbChange } from './useLiveQuery'

class FocusFlowDB extends Dexie {
  tasks!: Table<Task>
  sessions!: Table<PomodoroSession>
  alarms!: Table<Alarm>
  xpEvents!: Table<XPEvent>
  achievements!: Table<Achievement>
  profile!: Table<UserProfile>
  favorites!: Table<FavoriteQuote>
  stats!: Table<DailyStat>

  constructor() {
    super('FocusFlowDB')
    this.version(1).stores({
      tasks:        'id, date, status, priority, createdAt',
      sessions:     'id, date, type, taskId, startedAt',
      alarms:       'id',
      xpEvents:     'id, date, type, referenceId',
      achievements: 'id',
      profile:      'id',
      favorites:    'id',
      stats:        'date',
    })
  }
}

export const db = new FocusFlowDB()

// Automatically notify useLiveQuery hooks when any database records are modified
const tables = ['tasks', 'sessions', 'alarms', 'xpEvents', 'achievements', 'profile', 'favorites', 'stats'] as const
tables.forEach(tableName => {
  const table = db[tableName] as any
  if (table?.hook) {
    table.hook('creating', () => { setTimeout(notifyDbChange, 5) })
    table.hook('updating', () => { setTimeout(notifyDbChange, 5) })
    table.hook('deleting', () => { setTimeout(notifyDbChange, 5) })
  }
})

// ── Profile helpers ──────────────────────────────────
export async function getProfile(): Promise<UserProfile> {
  let p = await db.profile.get('profile')
  if (!p) {
    p = { id: 'profile', currentStreak: 0, longestStreak: 0, lastActiveDate: null, totalXP: 0, level: 1 }
    await db.profile.put(p)
  }
  return p
}

export async function updateProfile(updates: Partial<Omit<UserProfile, 'id'>>) {
  const p = await getProfile()
  const updated = { ...p, ...updates }
  // Recalculate level: level = floor(sqrt(totalXP / 50)) + 1
  if (updates.totalXP !== undefined) {
    updated.level = Math.floor(Math.sqrt(updated.totalXP / 50)) + 1
  }
  await db.profile.put(updated)
  return updated
}

// ── Task helpers ─────────────────────────────────────
export async function getTasks(date: string) {
  return db.tasks.where('date').equals(date).toArray()
}

export async function getAllTasks() {
  return db.tasks.orderBy('createdAt').reverse().toArray()
}

// ── Session helpers ───────────────────────────────────
export async function getSessionsForDate(date: string) {
  return db.sessions.where('date').equals(date).toArray()
}

// ── DailyStat helpers ─────────────────────────────────
export async function getOrCreateStat(date: string): Promise<DailyStat> {
  let stat = await db.stats.get(date)
  if (!stat) {
    stat = { date, focusMinutes: 0, tasksCompleted: 0, sessionsCompleted: 0, xpEarned: 0 }
    await db.stats.put(stat)
  }
  return stat
}

export async function incrementStat(date: string, field: keyof Omit<DailyStat, 'date'>, amount = 1) {
  const stat = await getOrCreateStat(date)
  await db.stats.put({ ...stat, [field]: stat[field] + amount })
}
