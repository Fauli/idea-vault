'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'

type ToastAction = {
  label: string
  onClick: () => void
}

type Toast = {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  action?: ToastAction
  duration?: number
}

type ShowToastOptions = {
  type?: Toast['type']
  action?: ToastAction
  duration?: number
}

type ToastContextType = {
  showToast: (message: string, options?: ShowToastOptions) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, options: ShowToastOptions = {}) => {
    const id = Math.random().toString(36).slice(2)
    const { type = 'success', action, duration } = options
    setToasts((prev) => [...prev, { id, message, type, action, duration }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[]
  onRemove: (id: string) => void
}) {
  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast
  onRemove: (id: string) => void
}) {
  const duration = toast.duration ?? 3000

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id)
    }, duration)
    return () => clearTimeout(timer)
  }, [toast.id, onRemove, duration])

  const handleAction = () => {
    if (toast.action) {
      toast.action.onClick()
      onRemove(toast.id)
    }
  }

  return (
    <div
      className={cn(
        'pointer-events-auto rounded-lg px-4 py-3 text-sm font-medium shadow-lg',
        'animate-in slide-in-from-bottom-2 fade-in duration-200',
        toast.type === 'success' && 'bg-green-600 text-white',
        toast.type === 'error' && 'bg-red-600 text-white',
        toast.type === 'info' && 'bg-foreground text-background'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {toast.type === 'success' && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
            </svg>
          )}
          {toast.type === 'error' && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
        {toast.action && (
          <button
            onClick={handleAction}
            className="font-semibold underline underline-offset-2 hover:no-underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>
    </div>
  )
}
