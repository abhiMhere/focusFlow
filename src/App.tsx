import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavStore } from './store/navStore'
import { useSettingsStore } from './store/settingsStore'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { Dashboard } from './components/dashboard/Dashboard'
import { TasksPage } from './components/tasks/TasksPage'
import { TimerPage } from './components/timer/TimerPage'
import { AlarmPage } from './components/alarm/AlarmPage'
import { MusicPage } from './components/music/MusicPage'
import { AchievementsPage } from './components/achievements/AchievementsPage'
import { StatisticsPage } from './components/statistics/StatisticsPage'
import { SettingsPage } from './components/settings/SettingsPage'
import { AlarmRinging } from './components/alarm/AlarmRinging'
import { MorningBriefing } from './components/alarm/MorningBriefing'
import { ToastContainer, useToast } from './components/ui/Toast'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './services/storage/db'
import { playAlarmBuzzer } from './services/audio/audioManager'
import { msUntilTime } from './utils/helpers'
import type { Alarm, DayOfWeek } from './types'
import { useTimerStore } from './store/timerStore'
import { WifiOff } from 'lucide-react'

export default function App() {
  const { page } = useNavStore()
  const { applyTheme, settings } = useSettingsStore()
  const { toasts, addToast, removeToast } = useToast()

  const [activeAlarm, setActiveAlarm] = useState<Alarm | null>(null)
  const [showBriefing, setShowBriefing] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  const stopBuzzerRef = useRef<(() => void) | null>(null)
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Apply theme & restore timer on mount
  useEffect(() => {
    applyTheme()
    useTimerStore.getState().restoreFromStorage()
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (settings.theme === 'system') applyTheme()
    }
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [applyTheme, settings.theme])

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      addToast('Back online — all data synced locally', 'info')
    }
    const handleOffline = () => {
      setIsOffline(true)
      addToast('Offline mode active — full functionality available', 'warning')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [addToast])

  // Global Alarm Scheduler
  const alarms = useLiveQuery(() => db.alarms.toArray(), [])

  useEffect(() => {
    if (!alarms) return

    // Clear previous scheduled timers
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current.clear()

    alarms.filter(a => a.enabled).forEach(alarm => {
      const now = new Date()
      const today = now.getDay() as DayOfWeek
      const shouldRingToday = alarm.days.length === 0 || alarm.days.includes(today)
      if (!shouldRingToday) return

      const ms = msUntilTime(alarm.time)
      // Only schedule if it's within the upcoming 24 hours
      if (ms > 0 && ms < 24 * 60 * 60 * 1000) {
        const timer = setTimeout(() => {
          stopBuzzerRef.current = playAlarmBuzzer()
          setActiveAlarm(alarm)
        }, ms)
        timersRef.current.set(alarm.id, timer)
      }
    })

    return () => {
      timersRef.current.forEach(t => clearTimeout(t))
    }
  }, [alarms])

  const handleDismissAlarm = () => {
    stopBuzzerRef.current?.()
    stopBuzzerRef.current = null
    setActiveAlarm(null)
  }

  // Render the current active view
  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard />
      case 'tasks':
        return <TasksPage />
      case 'timer':
        return <TimerPage />
      case 'alarm':
        return <AlarmPage />
      case 'music':
        return <MusicPage />
      case 'achievements':
        return <AchievementsPage />
      case 'statistics':
        return <StatisticsPage />
      case 'settings':
        return <SettingsPage />
      default:
        return <Dashboard />
    }
  }

  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        {/* Offline Notice Banner */}
        {isOffline && (
          <div
            style={{
              background: 'var(--accent2)',
              color: 'white',
              fontSize: 12,
              fontWeight: 500,
              padding: '4px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <WifiOff size={14} />
            <span>Offline mode — FocusFlow is running entirely from local storage</span>
          </div>
        )}

        {/* Top Header */}
        <TopBar onOpenBriefing={() => setShowBriefing(true)} />

        {/* Scrollable Page View */}
        <main className="page-content" role="main" tabIndex={-1}>
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: settings.reducedMotion ? 0.01 : 0.18, ease: 'easeOut' }}
              style={{ width: '100%', height: '100%' }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Alarm Ringing Overlay */}
      {activeAlarm && (
        <AlarmRinging
          alarm={activeAlarm}
          onDismiss={handleDismissAlarm}
        />
      )}

      {/* On-Demand Morning Briefing Overlay */}
      {showBriefing && (
        <MorningBriefing onClose={() => setShowBriefing(false)} />
      )}

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
