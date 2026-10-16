import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, Info, AlertTriangle } from 'lucide-react'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'info' | 'warning' | 'error'
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), 4000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, addToast, removeToast }
}

export function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 100,
      display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 340
    }} aria-live="polite">
      <AnimatePresence>
        {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={onRemove} />)}
      </AnimatePresence>
    </div>
  )
}

const ICONS = {
  success: <CheckCircle size={16} />,
  info:    <Info size={16} />,
  warning: <AlertTriangle size={16} />,
  error:   <AlertTriangle size={16} />,
}
const COLORS = {
  success: 'var(--accent)',
  info:    'var(--accent2)',
  warning: 'var(--warning)',
  error:   'var(--danger)',
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.9 }}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid var(--border)`,
        borderLeft: `3px solid ${COLORS[toast.type]}`,
        borderRadius: 10,
        padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <span style={{ color: COLORS[toast.type], flexShrink: 0 }}>{ICONS[toast.type]}</span>
      <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)' }}>{toast.message}</span>
      <button className="btn btn-ghost btn-icon-sm" onClick={() => onRemove(toast.id)} aria-label="Dismiss">
        <X size={13} />
      </button>
    </motion.div>
  )
}
