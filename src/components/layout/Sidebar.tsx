import React from 'react'
import {
  LayoutDashboard, CheckSquare, Timer, Bell, Music,
  Trophy, BarChart2, Settings, Zap, Flame, X
} from 'lucide-react'
import { useNavStore } from '../../store/navStore'
import type { PageId } from '../../types'
import { motion, AnimatePresence } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { getProfile } from '../../services/storage/db'
import { getLevel } from '../../utils/helpers'

const NAV_ITEMS: { id: PageId; label: string; Icon: React.ElementType }[] = [
  { id: 'dashboard',    label: 'Dashboard',    Icon: LayoutDashboard },
  { id: 'tasks',        label: 'Tasks',        Icon: CheckSquare },
  { id: 'timer',        label: 'Focus Timer',  Icon: Timer },
  { id: 'alarm',        label: 'Alarm',        Icon: Bell },
  { id: 'music',        label: 'Music',        Icon: Music },
  { id: 'achievements', label: 'Achievements', Icon: Trophy },
  { id: 'statistics',   label: 'Statistics',   Icon: BarChart2 },
  { id: 'settings',     label: 'Settings',     Icon: Settings },
]

interface SidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { page, navigate } = useNavStore()
  const profile = useLiveQuery(() => getProfile(), [])
  const { level, xpInLevel, xpForNext } = getLevel(profile?.totalXP ?? 0)
  const pct = xpForNext > 0 ? Math.round((xpInLevel / xpForNext) * 100) : 0

  return (
    <nav
      className="sidebar flex flex-col h-full py-5 px-3 gap-1"
      style={{ borderRight: '1px solid var(--border)', background: 'var(--bg-card)' }}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 mb-6">
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Zap size={18} color="white" />
        </div>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>FocusFlow</span>
        {onClose && (
          <button className="btn btn-ghost btn-icon ml-auto" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-0.5 flex-1">
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`nav-item ${page === id ? 'active' : ''}`}
            onClick={() => { navigate(id); onClose?.() }}
            aria-current={page === id ? 'page' : undefined}
          >
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* XP card */}
      {profile && (
        <div className="px-1 pb-2">
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: 10,
            padding: '10px 12px', border: '1px solid var(--border)'
          }}>
            <div className="flex items-center justify-between mb-2">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={14} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Level {level}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Flame size={13} style={{ color: '#ef4444' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {profile.currentStreak}d
                </span>
              </div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              {profile.totalXP} XP total · {xpForNext - xpInLevel} to next level
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

// Mobile nav overlay
export function MobileNavOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed', top: 0, left: 0, bottom: 0, width: 260, zIndex: 41,
              background: 'var(--bg-card)'
            }}
          >
            <Sidebar onClose={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
