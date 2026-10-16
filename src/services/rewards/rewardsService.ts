import { db, getProfile, updateProfile, incrementStat } from '../storage/db'
import { generateId, todayStr, formatDate } from '../../utils/helpers'
import type { AchievementId, XPEventType } from '../../types'
import { ACHIEVEMENT_DEFINITIONS } from '../../data/achievements'

export async function awardXP(
  type: XPEventType,
  xp: number,
  referenceId: string,
): Promise<number> {
  // Idempotency: check if this referenceId+type was already awarded
  const existing = await db.xpEvents
    .where('referenceId').equals(referenceId)
    .filter(e => e.type === type)
    .first()
  if (existing) return 0  // already awarded

  const date = todayStr()
  await db.xpEvents.add({
    id: generateId(),
    type,
    xp,
    referenceId,
    earnedAt: new Date().toISOString(),
    date,
  })

  const profile = await getProfile()
  await updateProfile({ totalXP: profile.totalXP + xp })
  await incrementStat(date, 'xpEarned', xp)

  return xp
}

export async function checkAndAwardAchievements(): Promise<AchievementId[]> {
  const newlyUnlocked: AchievementId[] = []
  const existing = await db.achievements.toArray()
  const existingIds = new Set(existing.map(a => a.id))

  const now = new Date().toISOString()

  // first_task: completed tasks total >= 1
  if (!existingIds.has('first_task')) {
    const count = await db.tasks.where('status').equals('completed').count()
    if (count >= 1) {
      await db.achievements.put({ id: 'first_task', unlockedAt: now })
      newlyUnlocked.push('first_task')
    }
  }

  // ten_tasks
  if (!existingIds.has('ten_tasks')) {
    const count = await db.tasks.where('status').equals('completed').count()
    if (count >= 10) {
      await db.achievements.put({ id: 'ten_tasks', unlockedAt: now })
      newlyUnlocked.push('ten_tasks')
    }
  }

  // first_session
  if (!existingIds.has('first_session')) {
    const count = await db.sessions.where('type').equals('focus').count()
    if (count >= 1) {
      await db.achievements.put({ id: 'first_session', unlockedAt: now })
      newlyUnlocked.push('first_session')
    }
  }

  // five_sessions
  if (!existingIds.has('five_sessions')) {
    const count = await db.sessions.where('type').equals('focus').count()
    if (count >= 5) {
      await db.achievements.put({ id: 'five_sessions', unlockedAt: now })
      newlyUnlocked.push('five_sessions')
    }
  }

  // hundred_minutes: total focus minutes >= 100
  if (!existingIds.has('hundred_minutes')) {
    const sessions = await db.sessions.where('type').equals('focus').toArray()
    const total = sessions.reduce((s, x) => s + x.durationMinutes, 0)
    if (total >= 100) {
      await db.achievements.put({ id: 'hundred_minutes', unlockedAt: now })
      newlyUnlocked.push('hundred_minutes')
    }
  }

  // perfect_day: all tasks completed for today
  if (!existingIds.has('perfect_day')) {
    const today = todayStr()
    const allTasks = await db.tasks.where('date').equals(today).toArray()
    if (allTasks.length > 0 && allTasks.every(t => t.status === 'completed')) {
      await db.achievements.put({ id: 'perfect_day', unlockedAt: now })
      newlyUnlocked.push('perfect_day')
    }
  }

  // streak_3 / streak_7
  const profile = await getProfile()
  if (!existingIds.has('streak_3') && profile.currentStreak >= 3) {
    await db.achievements.put({ id: 'streak_3', unlockedAt: now })
    newlyUnlocked.push('streak_3')
  }
  if (!existingIds.has('streak_7') && profile.currentStreak >= 7) {
    await db.achievements.put({ id: 'streak_7', unlockedAt: now })
    newlyUnlocked.push('streak_7')
  }

  return newlyUnlocked
}

export async function updateStreak(): Promise<void> {
  const today = todayStr()
  const profile = await getProfile()
  if (profile.lastActiveDate === today) return // already updated today

  const yesterday = formatDate(new Date(Date.now() - 86400000))
  const newStreak = profile.lastActiveDate === yesterday ? profile.currentStreak + 1 : 1
  const longestStreak = Math.max(profile.longestStreak, newStreak)
  await updateProfile({ currentStreak: newStreak, longestStreak, lastActiveDate: today })
}

export function getAchievementDef(id: string) {
  return ACHIEVEMENT_DEFINITIONS.find(a => a.id === id)
}
