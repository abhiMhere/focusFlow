import React, { useState, useEffect } from 'react'
import { Menu, Sun, Moon, Monitor, Sunrise } from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'
import { MobileNavOverlay } from './Sidebar'
import { formatTime } from '../../utils/helpers'

interface TopBarProps {
  onOpenBriefing?: () => void
}

export function TopBar({ onOpenBriefing }: TopBarProps) {
  const { settings, updateSettings } = useSettingsStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [time, setTime] = useState(() => formatTime(new Date()))

  useEffect(() => {
    const id = setInterval(() => setTime(formatTime(new Date())), 1000)
    return () => clearInterval(id)
  }, [])

  const themeIcons = {
    light:  <Sun size={16} />,
    dark:   <Moon size={16} />,
    system: <Monitor size={16} />,
  }

  const cycleTheme = () => {
    const order: Array<'light'|'dark'|'system'> = ['light', 'dark', 'system']
    const idx = order.indexOf(settings.theme)
    updateSettings({ theme: order[(idx + 1) % 3] })
  }

  return (
    <>
      <header
        className="flex items-center gap-3 px-4 py-3 md:hidden"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}
      >
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>
          FocusFlow
        </span>
        <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
          {time}
        </span>
        {onOpenBriefing && (
          <button
            className="btn btn-ghost btn-icon"
            onClick={onOpenBriefing}
            title="Morning Briefing"
            aria-label="Morning Briefing"
          >
            <Sunrise size={18} style={{ color: 'var(--accent2)' }} />
          </button>
        )}
        <button className="btn btn-ghost btn-icon" onClick={cycleTheme} aria-label="Toggle theme">
          {themeIcons[settings.theme]}
        </button>
      </header>

      {/* Desktop top-right area */}
      <div
        className="hidden md:flex items-center gap-3 px-6 py-3"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
          {onOpenBriefing && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={onOpenBriefing}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Sunrise size={14} style={{ color: 'var(--accent2)' }} />
              <span>Morning Briefing</span>
            </button>
          )}
        </div>
        <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
          {time}
        </span>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={cycleTheme} aria-label="Toggle theme">
          {themeIcons[settings.theme]}
        </button>
      </div>

      <MobileNavOverlay open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}
