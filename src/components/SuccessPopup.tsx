import React, { useEffect } from 'react'
import './SuccessPopup.css'

interface SuccessPopupProps {
  message: string
  onClose: () => void
  duration?: number
}

const SuccessPopup: React.FC<SuccessPopupProps> = ({ message, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div className="success-popup-overlay">
      <div className="success-popup">
        <div className="success-animation">
          <div className="success-circle">
            <div className="success-checkmark">
              <div className="checkmark-stem"></div>
              <div className="checkmark-kick"></div>
            </div>
          </div>
        </div>
        <h2 className="success-title">성공!</h2>
        <p className="success-message">{message}</p>
        <div className="success-progress">
          <div className="progress-bar" style={{ animationDuration: `${duration}ms` }}></div>
        </div>
      </div>
    </div>
  )
}

export default SuccessPopup