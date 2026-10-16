import { useState, useEffect } from 'react'

export function notifyDbChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('focusflow:dbchange'))
  }
}

/**
 * Robust live query hook for Dexie IndexedDB tables.
 * Re-executes on dependency changes, custom DB change events, and periodic 800ms pulses.
 */
export function useLiveQuery<T>(
  querier: () => Promise<T> | T,
  deps: any[] = [],
  defaultResult?: T
): T | undefined {
  const [value, setValue] = useState<T | undefined>(defaultResult)

  useEffect(() => {
    let active = true

    const run = async () => {
      try {
        const result = await querier()
        if (active) {
          setValue(result)
        }
      } catch (err) {
        console.warn('LiveQuery fetch warning:', err)
      }
    }

    run()

    // Listen to explicit DB mutation events
    const handleDbChange = () => {
      run()
    }

    window.addEventListener('focusflow:dbchange', handleDbChange)
    // Polling pulse for external or background updates
    const intervalId = setInterval(run, 800)

    return () => {
      active = false
      window.removeEventListener('focusflow:dbchange', handleDbChange)
      clearInterval(intervalId)
    }
  }, deps)

  return value
}

export default useLiveQuery
