import { useEffect, useState } from 'react'
import './Toast.css'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastMessage {
  id: string
  message: string
  type: ToastType
}

interface ToastProps {
  message: string
  type: ToastType
  duration?: number
  onClose: () => void
}

const Toast: React.FC<ToastProps> = ({ message, type, duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'info':
        return 'ℹ️'
    }
  }

  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon">{getIcon()}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  )
}

// Toast Container Component
export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    const handleToast = (event: CustomEvent<{ message: string; type: ToastType }>) => {
      const newToast: ToastMessage = {
        id: `${Date.now()}-${Math.random()}`,
        message: event.detail.message,
        type: event.detail.type
      }
      setToasts(prev => [...prev, newToast])
    }

    window.addEventListener('showToast' as any, handleToast)
    return () => window.removeEventListener('showToast' as any, handleToast)
  }, [])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}

// Helper function to show toast
export const showToast = (message: string, type: ToastType = 'info') => {
  const event = new CustomEvent('showToast', {
    detail: { message, type }
  })
  window.dispatchEvent(event)
}

export default Toast