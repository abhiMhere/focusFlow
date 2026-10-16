import React, { useState, useEffect } from 'react'
import {
  Settings, Moon, Sun, Monitor, Bell, Volume2, VolumeX,
  Clock, Download, Upload, Trash2, RefreshCw, Smartphone, Check, AlertCircle, Info
} from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'
import {
  getNotificationPermission, requestNotificationPermission,
  sendNotification, isNotificationsSupported
} from '../../services/notifications/notificationService'
import { db } from '../../services/storage/db'
import { formatDate } from '../../utils/helpers'

export function SettingsPage() {
  const { settings, updateSettings, resolvedTheme } = useSettingsStore()
  const [notifPerm, setNotifPerm] = useState(getNotificationPermission())
  const [savedMsg, setSavedMsg] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if installed as standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    const handleBeforeInstall = (e: any) => {
      e.preventDefault()
      setInstallPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  const showSaveNotice = (msg = 'Settings saved') => {
    setSavedMsg(msg)
    setTimeout(() => setSavedMsg(''), 2500)
  }

  const handleNotificationRequest = async () => {
    const res = await requestNotificationPermission()
    setNotifPerm(res)
    if (res === 'granted') {
      updateSettings({ notificationsEnabled: true })
      sendNotification('FocusFlow Notifications Active', {
        body: 'You will receive gentle reminders when timers and alarms ring.',
      })
      showSaveNotice('Notifications enabled!')
    }
  }

  const handleTestNotification = () => {
    sendNotification('FocusFlow Test', {
      body: 'Notifications are working seamlessly on your device.',
    })
  }

  const handleExportData = async () => {
    const tasks = await db.tasks.toArray()
    const sessions = await db.sessions.toArray()
    const alarms = await db.alarms.toArray()
    const xpEvents = await db.xpEvents.toArray()
    const achievements = await db.achievements.toArray()
    const profile = await db.profile.get('profile')
    const stats = await db.stats.toArray()

    const fullBackup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      profile,
      tasks,
      sessions,
      alarms,
      xpEvents,
      achievements,
      stats
    }

    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `focusflow-backup-${formatDate(new Date())}.json`
    a.click()
    URL.revokeObjectURL(url)
    showSaveNotice('Backup downloaded')
  }

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string
        const data = JSON.parse(content)

        if (data.tasks) await db.tasks.bulkPut(data.tasks)
        if (data.sessions) await db.sessions.bulkPut(data.sessions)
        if (data.alarms) await db.alarms.bulkPut(data.alarms)
        if (data.xpEvents) await db.xpEvents.bulkPut(data.xpEvents)
        if (data.achievements) await db.achievements.bulkPut(data.achievements)
        if (data.profile) await db.profile.put(data.profile)
        if (data.stats) await db.stats.bulkPut(data.stats)
        if (data.settings) updateSettings(data.settings)

        showSaveNotice('Data imported successfully!')
      } catch (err) {
        alert('Invalid backup file format.')
      }
    }
    reader.readAsText(file)
  }

  const handleClearCompletedTasks = async () => {
    const completed = await db.tasks.where('status').equals('completed').toArray()
    await db.tasks.bulkDelete(completed.map(t => t.id))
    showSaveNotice(`Cleared ${completed.length} completed tasks`)
  }

  const handleResetAllData = async () => {
    await db.tasks.clear()
    await db.sessions.clear()
    await db.alarms.clear()
    await db.xpEvents.clear()
    await db.achievements.clear()
    await db.stats.clear()
    await db.profile.put({
      id: 'profile',
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      totalXP: 0,
      level: 1,
    })
    setConfirmReset(false)
    showSaveNotice('All data reset to fresh start')
  }

  const handleInstallPWA = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
      setInstallPrompt(null)
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Settings
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
            Personalize your FocusFlow routines and workspace
          </p>
        </div>
        {savedMsg && (
          <div className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px' }}>
            <Check size={14} /> {savedMsg}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">

        {/* 1. Appearance */}
        <section className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>
            Appearance & Theme
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'system', label: 'System', icon: Monitor },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className="btn"
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '14px 10px',
                  background: settings.theme === id ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: settings.theme === id ? 'white' : 'var(--text-primary)',
                  border: settings.theme === id ? '1px solid var(--accent)' : '1px solid var(--border)',
                }}
                onClick={() => { updateSettings({ theme: id as any }); showSaveNotice(); }}
              >
                <Icon size={18} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)' }}>Reduced Motion</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Minimize animations and transitions</div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={e => { updateSettings({ reducedMotion: e.target.checked }); showSaveNotice(); }}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </section>

        {/* 2. Focus Timer Settings */}
        <section className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>
            Pomodoro Focus Timer
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Focus Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                className="input"
                value={settings.focusDuration}
                onChange={e => { updateSettings({ focusDuration: Math.max(1, parseInt(e.target.value) || 25) }); showSaveNotice(); }}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Short Break (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                className="input"
                value={settings.shortBreakDuration}
                onChange={e => { updateSettings({ shortBreakDuration: Math.max(1, parseInt(e.target.value) || 5) }); showSaveNotice(); }}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Long Break (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                className="input"
                value={settings.longBreakDuration}
                onChange={e => { updateSettings({ longBreakDuration: Math.max(1, parseInt(e.target.value) || 15) }); showSaveNotice(); }}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Long Break Interval (sessions)
              </label>
              <input
                type="number"
                min="1"
                max="12"
                className="input"
                value={settings.longBreakAfter}
                onChange={e => { updateSettings({ longBreakAfter: Math.max(1, parseInt(e.target.value) || 4) }); showSaveNotice(); }}
              />
            </div>
          </div>
        </section>

        {/* 3. Audio & Feedback */}
        <section className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>
            Audio & Ambient Sound
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)' }}>Sound Effects</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Chimes on timer finish and task completion</div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={e => { updateSettings({ soundEnabled: e.target.checked }); showSaveNotice(); }}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)' }}>Ticking Audio</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Subtle clock ticking pulse during active focus</div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.tickingEnabled}
                  onChange={e => { updateSettings({ tickingEnabled: e.target.checked }); showSaveNotice(); }}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Default Ambient Music Volume</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={e => { updateSettings({ musicVolume: parseFloat(e.target.value) }); showSaveNotice(); }}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </div>
          </div>
        </section>

        {/* 4. Day Planning & Hours */}
        <section className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>
            Day Routine & Work Schedule
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Wake Up Time
              </label>
              <input
                type="time"
                className="input"
                value={settings.wakeUpTime}
                onChange={e => { updateSettings({ wakeUpTime: e.target.value }); showSaveNotice(); }}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Work Start Time
              </label>
              <input
                type="time"
                className="input"
                value={settings.workStartTime}
                onChange={e => { updateSettings({ workStartTime: e.target.value }); showSaveNotice(); }}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Available Hours / Day
              </label>
              <input
                type="number"
                min="1"
                max="24"
                className="input"
                value={settings.availableHours}
                onChange={e => { updateSettings({ availableHours: Math.max(1, parseInt(e.target.value) || 8) }); showSaveNotice(); }}
              />
            </div>
          </div>
        </section>

        {/* 5. Browser Notifications */}
        <section className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>
            Notifications
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)' }}>
                System Notifications
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Permission status: <strong style={{ textTransform: 'capitalize' }}>{notifPerm}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {notifPerm === 'granted' ? (
                <button className="btn btn-secondary btn-sm" onClick={handleTestNotification}>
                  Send Test
                </button>
              ) : notifPerm !== 'unsupported' ? (
                <button className="btn btn-primary btn-sm" onClick={handleNotificationRequest}>
                  <Bell size={14} /> Enable
                </button>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Not supported</span>
              )}
            </div>
          </div>
        </section>

        {/* 6. PWA & Installation */}
        <section className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>
            PWA & Offline Capability
          </h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone size={24} style={{ color: 'var(--accent)' }} />
              <div>
                <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)' }}>
                  {isInstalled ? 'FocusFlow is Installed' : 'Install FocusFlow as an App'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Works completely offline with instant loading and local data storage
                </div>
              </div>
            </div>

            {installPrompt && !isInstalled && (
              <button className="btn btn-primary btn-sm" onClick={handleInstallPWA}>
                Install App
              </button>
            )}
            {isInstalled && (
              <span className="badge badge-success">Installed</span>
            )}
          </div>
        </section>

        {/* 7. Data Management & Backup */}
        <section className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>
            Data Backup & Privacy
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            All your data is saved locally on your device in IndexedDB. No accounts or external tracking required.
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            <button className="btn btn-secondary btn-sm" onClick={handleExportData}>
              <Download size={14} /> Export Backup (.json)
            </button>

            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
              <Upload size={14} /> Restore Backup
              <input type="file" accept=".json" onChange={handleImportData} style={{ display: 'none' }} />
            </label>

            <button className="btn btn-ghost btn-sm" onClick={handleClearCompletedTasks}>
              <Trash2 size={14} /> Clear Done Tasks
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            {!confirmReset ? (
              <button
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--danger)' }}
                onClick={() => setConfirmReset(true)}
              >
                Reset All App Data
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(239, 68, 68, 0.1)', padding: 12, borderRadius: 8 }}>
                <AlertCircle size={16} color="var(--danger)" />
                <span style={{ fontSize: 13, color: 'var(--danger)', flex: 1 }}>
                  Are you sure? This will permanently delete all tasks, sessions, alarms, and stats.
                </span>
                <button className="btn btn-danger btn-sm" onClick={handleResetAllData}>
                  Yes, Reset
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setConfirmReset(false)}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  )
}
