import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import MobileLogin from './components/MobileLogin'
import OrinIdManagement from './components/OrinIdManagement'
import { ToastContainer } from './components/Toast'
import authService from './services/authService'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated())
  }, [])

  return (
    <Router>
      <div className="app">
        <ToastContainer />
        <header className="app-header">
          <div className="header-content">
            <div className="logo-section">
              <h1>시큐어인증</h1>
              <p>차세대 QR 인증 시스템</p>
            </div>
            {isAuthenticated && (
              <nav className="nav-menu">
                <Link to="/" className="nav-link">대시보드</Link>
                <Link to="/orin-id" className="nav-link">오린ID 관리</Link>
                <button 
                  className="logout-btn"
                  onClick={() => {
                    authService.logout()
                    setIsAuthenticated(false)
                    window.location.href = '/'
                  }}
                >
                  로그아웃
                </button>
              </nav>
            )}
          </div>
        </header>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={
              <MobileLogin onAuthChange={setIsAuthenticated} />
            } />
            <Route path="/orin-id" element={
              isAuthenticated ? <OrinIdManagement /> : <Navigate to="/" />
            } />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App