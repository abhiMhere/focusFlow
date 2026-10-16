import React, { useState } from 'react'
import { BarChart2, TrendingUp, Clock, CheckSquare, Zap, Flame } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getProfile } from '../../services/storage/db'
import { formatDuration, formatDate, parseLocalDate } from '../../utils/helpers'

type Range = '7d' | '30d' | 'all'

function getDateRange(range: Range): string[] {
  const days: string[] = []
  const now = new Date()
  const count = range === '7d' ? 7 : range === '30d' ? 30 : 90
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    days.push(formatDate(d))
  }
  return days
}

export function StatisticsPage() {
  const [range, setRange] = useState<Range>('7d')
  const stats = useLiveQuery(() => db.stats.toArray(), [])
  const sessions = useLiveQuery(() => db.sessions.toArray(), [])
  const profile = useLiveQuery(() => getProfile(), [])

  const days = getDateRange(range)
  const statsMap = new Map(stats?.map(s => [s.date, s]) ?? [])

  const rangeStats = days.map(d => statsMap.get(d) ?? {
    date: d, focusMinutes: 0, tasksCompleted: 0, sessionsCompleted: 0, xpEarned: 0
  })

  const totalFocusMinutes = rangeStats.reduce((s, x) => s + x.focusMinutes, 0)
  const totalTasks = rangeStats.reduce((s, x) => s + x.tasksCompleted, 0)
  const totalSessions = rangeStats.reduce((s, x) => s + x.sessionsCompleted, 0)
  const totalXP = rangeStats.reduce((s, x) => s + x.xpEarned, 0)

  const maxFocus = Math.max(...rangeStats.map(s => s.focusMinutes), 1)
  const maxTasks = Math.max(...rangeStats.map(s => s.tasksCompleted), 1)

  // Most productive day
  const bestDay = [...rangeStats].sort((a, b) => b.focusMinutes - a.focusMinutes)[0]

  const handleExport = () => {
    db.tasks.toArray().then(tasks => {
      db.sessions.toArray().then(sess => {
        db.xpEvents.toArray().then(xp => {
          db.achievements.toArray().then(ach => {
            const data = { exportedAt: new Date().toISOString(), tasks, sessions: sess, xpEvents: xp, achievements: ach }
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url; a.download = `focusflow-backup-${formatDate(new Date())}.json`
            a.click()
            URL.revokeObjectURL(url)
          })
        })
      })
    })
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Statistics</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>Based on your actual activity</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={handleExport}>Export Data</button>
      </div>

      {/* Range selector */}
      <div style={{ display: 'flex', gap: 8, background: 'var(--bg-secondary)', padding: 5, borderRadius: 10, width: 'fit-content', marginBottom: 24 }}>
        {(['7d', '30d', 'all'] as Range[]).map(r => (
          <button key={r} className="btn btn-sm"
            style={{
              background: range === r ? 'var(--bg-card)' : 'transparent',
              color: range === r ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: range === r ? 'var(--shadow-sm)' : 'none',
            }}
            onClick={() => setRange(r)}>
            {r === '7d' ? 'Last 7 days' : r === '30d' ? 'Last 30 days' : 'All time'}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
        <SumCard label="Focus Time" value={formatDuration(totalFocusMinutes)} color="var(--accent)" Icon={Clock} />
        <SumCard label="Tasks Done" value={totalTasks} color="var(--accent2)" Icon={CheckSquare} />
        <SumCard label="Sessions" value={totalSessions} color="#9b8fd9" Icon={TrendingUp} />
        <SumCard label="XP Earned" value={totalXP} color="#f59e0b" Icon={Zap} />
      </div>

      {/* Profile stats */}
      {profile && (
        <div className="card" style={{ padding: 16, marginBottom: 24, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <Flame size={18} style={{ color: '#ef4444', display: 'block', margin: '0 auto 4px' }} />
            <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--text-primary)' }}>{profile.currentStreak}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Current streak</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Flame size={18} style={{ color: 'var(--text-muted)', display: 'block', margin: '0 auto 4px' }} />
            <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--text-primary)' }}>{profile.longestStreak}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Longest streak</div>
          </div>
          {bestDay && bestDay.focusMinutes > 0 && (
            <div style={{ textAlign: 'center' }}>
              <BarChart2 size={18} style={{ color: 'var(--accent)', display: 'block', margin: '0 auto 4px' }} />
              <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--text-primary)' }}>{formatDuration(bestDay.focusMinutes)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Best day ({bestDay.date})</div>
            </div>
          )}
        </div>
      )}

      {/* Focus minutes bar chart */}
      {totalFocusMinutes > 0 ? (
        <>
          <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16 }}>Focus Minutes</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
              {rangeStats.map(s => (
                <div key={s.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div
                    style={{
                      width: '100%', borderRadius: '3px 3px 0 0',
                      background: s.focusMinutes > 0 ? 'var(--accent)' : 'var(--bg-secondary)',
                      height: `${(s.focusMinutes / maxFocus) * 72 + (s.focusMinutes > 0 ? 8 : 0)}px`,
                      minHeight: s.focusMinutes > 0 ? 8 : 2,
                      transition: 'height 0.5s ease',
                    }}
                    title={`${s.date}: ${formatDuration(s.focusMinutes)}`}
                  />
                </div>
              ))}
            </div>
            {range === '7d' && (
              <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
                {rangeStats.map(s => (
                  <div key={s.date} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'var(--text-muted)' }}>
                    {new Date(parseLocalDate(s.date)).toLocaleDateString('en-US', { weekday: 'narrow' })}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16 }}>Tasks Completed</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60 }}>
              {rangeStats.map(s => (
                <div key={s.date} style={{ flex: 1 }}>
                  <div
                    style={{
                      width: '100%', borderRadius: '3px 3px 0 0',
                      background: s.tasksCompleted > 0 ? 'var(--accent2)' : 'var(--bg-secondary)',
                      height: `${(s.tasksCompleted / maxTasks) * 52 + (s.tasksCompleted > 0 ? 8 : 0)}px`,
                      minHeight: s.tasksCompleted > 0 ? 8 : 2,
                      transition: 'height 0.5s ease',
                    }}
                    title={`${s.date}: ${s.tasksCompleted} tasks`}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <BarChart2 size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <h3 style={{ margin: '0 0 8px', color: 'var(--text-secondary)', fontWeight: 600 }}>No data yet</h3>
          <p style={{ margin: 0, fontSize: 14 }}>Complete tasks and focus sessions to see your statistics here.</p>
        </div>
      )}
    </div>
  )
}

function SumCard({ label, value, color, Icon }: {
  label: string; value: string | number; color: string; Icon: React.ElementType
}) {
  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Icon size={14} style={{ color }} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}
