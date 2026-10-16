import React from 'react'
import { motion } from 'framer-motion'
import { Trophy, Lock } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getProfile } from '../../services/storage/db'
import { ACHIEVEMENT_DEFINITIONS } from '../../data/achievements'
import { getLevel } from '../../utils/helpers'

export function AchievementsPage() {
  const achievements = useLiveQuery(() => db.achievements.toArray(), [])
  const profile = useLiveQuery(() => getProfile(), [])

  const unlockedIds = new Set(achievements?.map(a => a.id) ?? [])
  const { level, xpInLevel, xpForNext } = getLevel(profile?.totalXP ?? 0)
  const xpPct = xpForNext > 0 ? Math.round((xpInLevel / xpForNext) * 100) : 0

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="flex items-center gap-3 mb-2">
        <Trophy size={22} style={{ color: 'var(--accent)' }} />
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Achievements</h1>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
        {unlockedIds.size}/{ACHIEVEMENT_DEFINITIONS.length} unlocked
      </p>

      {/* Profile card */}
      {profile && (
        <div className="card" style={{ padding: 20, marginBottom: 24, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Current Level</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent)' }}>Level {level}</div>
            <div className="progress-bar" style={{ marginTop: 8 }}>
              <div className="progress-fill" style={{ width: `${xpPct}%` }} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              {xpInLevel} / {xpForNext} XP to next level
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>{profile.totalXP}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total XP</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#ef4444' }}>{profile.currentStreak}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Day streak</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>{profile.longestStreak}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Best streak</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent)' }}>{unlockedIds.size}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Unlocked</div>
            </div>
          </div>
        </div>
      )}

      {/* Achievements grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        {ACHIEVEMENT_DEFINITIONS.map(def => {
          const unlocked = unlockedIds.has(def.id)
          const achievement = achievements?.find(a => a.id === def.id)
          return (
            <motion.div
              key={def.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card"
              style={{
                padding: '18px 16px',
                opacity: unlocked ? 1 : 0.5,
                borderColor: unlocked ? 'var(--accent)' : 'var(--border)',
                background: unlocked ? 'var(--bg-card)' : 'var(--bg-secondary)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {unlocked && (
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--accent)'
                }} />
              )}
              <div style={{ fontSize: 32, marginBottom: 8 }}>{def.icon}</div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                {def.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {def.description}
              </div>
              {unlocked && achievement && (
                <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 8, fontWeight: 600 }}>
                  Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                </div>
              )}
              {!unlocked && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>
                  <Lock size={11} /> Locked
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
