import { create } from 'zustand'
import { loadSettings, saveSettings } from '../services/storage/localStorage'
import type { AppSettings } from '../types'

interface SettingsStore {
  settings: AppSettings
  updateSettings: (updates: Partial<AppSettings>) => void
  resolvedTheme: 'light' | 'dark'
  applyTheme: () => void
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: loadSettings(),
  resolvedTheme: 'light',

  updateSettings(updates) {
    const next = { ...get().settings, ...updates }
    saveSettings(next)
    set({ settings: next })
    get().applyTheme()
  },

  applyTheme() {
    const { theme } = get().settings
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = theme === 'dark' || (theme === 'system' && prefersDark)
    document.documentElement.classList.toggle('dark', dark)
    set({ resolvedTheme: dark ? 'dark' : 'light' })
  },
}))
