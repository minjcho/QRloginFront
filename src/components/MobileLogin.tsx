import { useState, useEffect } from 'react'
import QrScanner from './QrScanner'
import { getApiUrl } from '../config/api'
import { showToast } from './Toast'
import authService from '../services/authService'

interface MobileLoginProps {
  onLogin?: (token: string) => void
  onAuthChange?: (isAuthenticated: boolean) => void
}

interface LoginFormData {
  email: string
  password: string
}

const MobileLogin: React.FC<MobileLoginProps> = ({ onAuthChange }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userToken, setUserToken] = useState('')
  const [loginForm, setLoginForm] = useState<LoginFormData>({ email: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [showScanner, setShowScanner] = useState(false)

  useEffect(() => {
    // Check if user already has a token
    const token = localStorage.getItem('accessToken')
    if (token) {
      setUserToken(token)
      setIsAuthenticated(true)
      onAuthChange?.(true)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)
    setLoginError('')

    try {
      const response = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm)
      })

      if (response.ok) {
        const data = await response.json()
        setUserToken(data.accessToken)
        authService.storeTokens(data)
        setIsAuthenticated(true)
        onAuthChange?.(true)
        showToast('로그인 성공!', 'success')
      } else {
        const errorData = await response.json()
        setLoginError(errorData.message || '로그인 실패')
      }
    } catch (error) {
      setLoginError('네트워크 오류. 연결을 확인해주세요.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleSignup = async () => {
    if (!loginForm.email || !loginForm.password) {
      setLoginError('모든 필드를 입력해주세요')
      return
    }

    setIsLoggingIn(true)
    setLoginError('')

    try {
      const response = await fetch(getApiUrl('/api/auth/signup'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm)
      })

      if (response.status === 201) {
        showToast('계정 생성 성공! 로그인 중...', 'success')
        // Auto-login after successful signup
        const loginEvent = new Event('submit') as any
        loginEvent.preventDefault = () => {}
        await handleLogin(loginEvent)
      } else {
        const errorData = await response.json()
        setLoginError(errorData.error || '회원가입 실패')
      }
    } catch (error) {
      setLoginError('네트워크 오류. 연결을 확인해주세요.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleQrApproval = async (qrData: any) => {
    try {
      const response = await fetch(getApiUrl('/api/qr/approve'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          challengeId: qrData.challengeId,
          nonce: qrData.nonce
        })
      })

      if (response.ok) {
        await response.json()
        showToast('데스크톱 로그인 승인 성공!', 'success')
        setShowScanner(false)
      } else {
        const errorData = await response.json()
        showToast(`로그인 승인 실패: ${errorData.message}`, 'error')
      }
    } catch (error) {
      showToast('로그인 승인 오류. 다시 시도해주세요.', 'error')
    }
  }

  const handleLogout = () => {
    authService.logout()
    setIsAuthenticated(false)
    setUserToken('')
    onAuthChange?.(false)
    showToast('로그아웃 되었습니다', 'info')
  }

  if (!isAuthenticated) {
    return (
      <div className="mobile-login">
        <div className="login-container">
          <h2>📱 모바일 로그인</h2>
          <p>QR 코드 스캔을 위해 로그인하세요</p>
          
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <input
                type="email"
                placeholder="이메일"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <input
                type="password"
                placeholder="비밀번호 (최소 8자)"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
                minLength={8}
                className="form-input"
              />
            </div>
            
            {loginError && (
              <div className="error-message">
                {loginError}
              </div>
            )}
            
            <div className="form-actions">
              <button 
                type="submit" 
                disabled={isLoggingIn}
                className="login-btn"
              >
                {isLoggingIn ? '로그인 중...' : '로그인'}
              </button>
              
              <button 
                type="button" 
                onClick={handleSignup}
                disabled={isLoggingIn}
                className="signup-btn"
              >
                {isLoggingIn ? '가입 중...' : '회원가입'}
              </button>
            </div>
          </form>
          
          <div className="demo-credentials">
            <h3>테스트 계정:</h3>
            <div className="demo-account">
              <strong>관리자:</strong>
              <p>📧 admin@example.com</p>
              <p>🔑 admin123</p>
            </div>
            <div className="demo-account">
              <strong>사용자:</strong>
              <p>📧 user@example.com</p>
              <p>🔑 user123</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-authenticated">
      <div className="auth-container">
        <h2>📱 모바일 - 인증됨</h2>
        <p>로그인되었습니다. QR 코드를 스캔할 준비가 되었습니다</p>
        
        <div className="user-info">
          <div className="auth-status">
            <span className="status-indicator">🟢</span>
            <span>인증됨</span>
          </div>
        </div>
        
        <div className="scanner-section">
          {!showScanner ? (
            <div className="scanner-prompt">
              <h3>QR 코드 스캔 준비</h3>
              <p>데스크톱의 QR 코드를 스캔하여 로그인을 승인하세요</p>
              <button 
                onClick={() => setShowScanner(true)}
                className="scan-btn"
              >
                📷 QR 스캐너 시작
              </button>
            </div>
          ) : (
            <div className="scanner-active">
              <QrScanner onScanSuccess={handleQrApproval} />
              <button 
                onClick={() => setShowScanner(false)}
                className="close-scanner-btn"
              >
                ✕ 스캐너 닫기
              </button>
            </div>
          )}
        </div>
        
        <div className="mobile-instructions">
          <h3>데스크톱 로그인 승인 방법:</h3>
          <ol>
            <li>데스크톱 버전으로 이동하세요</li>
            <li>데스크톱에 QR 코드가 표시됩니다</li>
            <li>위의 "QR 스캐너 시작" 버튼을 클릭하세요</li>
            <li>카메라를 QR 코드에 비춰주세요</li>
            <li>로그인 승인 메시지가 나타나면 승인하세요</li>
          </ol>
        </div>
        
        <div className="logout-section">
          <button onClick={handleLogout} className="logout-btn">
            🚪 로그아웃
          </button>
        </div>
      </div>
    </div>
  )
}

export default MobileLogin