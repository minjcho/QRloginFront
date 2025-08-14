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
          <h1>QR Login System</h1>
          <p>Secure authentication with QR codes</p>
          {isAuthenticated && (
            <nav className="nav-menu">
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/orin-id" className="nav-link">OrinId 관리</Link>
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
        </header>
        
        <Routes>
          <Route path="/" element={
            <MobileLogin onAuthChange={setIsAuthenticated} />
          } />
          <Route path="/orin-id" element={
            isAuthenticated ? <OrinIdManagement /> : <Navigate to="/" />
          } />
        </Routes>
      </div>
    </Router>
  )
}

export default App