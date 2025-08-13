import { useState, useEffect } from 'react'
import DesktopLogin from './components/DesktopLogin'
import MobileLogin from './components/MobileLogin'
import { ToastContainer } from './components/Toast'
import './App.css'

function App() {
  const [isMobile, setIsMobile] = useState(false)
  const [isDesktopAuthenticated, setIsDesktopAuthenticated] = useState(false)

  useEffect(() => {
    // Detect mobile device
    const checkIfMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth <= 768
    }
    
    setIsMobile(checkIfMobile())
  }, [])

  const handleDesktopLogin = (token: string) => {
    localStorage.setItem('desktopAccessToken', token)
    setIsDesktopAuthenticated(true)
  }

  const handleDesktopLogout = () => {
    localStorage.removeItem('desktopAccessToken')
    localStorage.removeItem('desktopRefreshToken')
    setIsDesktopAuthenticated(false)
  }

  // Only show success screen for desktop authentication
  if (!isMobile && isDesktopAuthenticated) {
    return (
      <div className="app">
        <ToastContainer />
        <div className="auth-success">
          <h1>🎉 Login Successful!</h1>
          <p>You are now authenticated via QR Login System</p>
          <button onClick={handleDesktopLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <ToastContainer />
      <header className="app-header">
        <h1>QR Login System</h1>
        <p>Secure authentication with QR codes</p>
      </header>
      
      {isMobile ? (
        <MobileLogin />
      ) : (
        <DesktopLogin onLogin={handleDesktopLogin} />
      )}
      
      <footer className="app-footer">
        <p>Switch to {isMobile ? 'Desktop' : 'Mobile'} view:</p>
        <button 
          onClick={() => setIsMobile(!isMobile)}
          className="toggle-view-btn"
        >
          {isMobile ? '🖥️ Desktop View' : '📱 Mobile View'}
        </button>
      </footer>
    </div>
  )
}

export default App
