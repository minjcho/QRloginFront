import { getApiUrl } from '../config/api'

interface TokenResponse {
  accessToken: string
  refreshToken: string
  orinId?: string
  accessTokenExpiresIn: number
  refreshTokenExpiresIn: number
}

class AuthService {
  private refreshPromise: Promise<TokenResponse> | null = null
  private tokenExpiryTimer: NodeJS.Timeout | null = null

  // Initialize token refresh monitoring
  initTokenRefresh() {
    const accessToken = localStorage.getItem('accessToken')
    if (accessToken) {
      this.scheduleTokenRefresh()
    }
  }

  // Schedule token refresh before expiry
  private scheduleTokenRefresh() {
    // Clear existing timer
    if (this.tokenExpiryTimer) {
      clearTimeout(this.tokenExpiryTimer)
    }

    // Get token expiry time (default 15 minutes)
    const expiryTime = this.getTokenExpiryTime()
    if (!expiryTime) return

    // Calculate when to refresh (2 minutes before expiry)
    const refreshTime = expiryTime - 2 * 60 * 1000
    const timeUntilRefresh = refreshTime - Date.now()

    if (timeUntilRefresh > 0) {
      this.tokenExpiryTimer = setTimeout(() => {
        this.refreshAccessToken()
      }, timeUntilRefresh)
    } else {
      // Token is about to expire or already expired
      this.refreshAccessToken()
    }
  }

  // Get token expiry time from storage
  private getTokenExpiryTime(): number | null {
    const expiryTime = localStorage.getItem('tokenExpiry')
    return expiryTime ? parseInt(expiryTime) : null
  }

  // Set token expiry time
  private setTokenExpiry(expiresIn: number) {
    const expiryTime = Date.now() + expiresIn
    localStorage.setItem('tokenExpiry', expiryTime.toString())
  }

  // Store tokens in localStorage
  storeTokens(tokens: TokenResponse) {
    localStorage.setItem('accessToken', tokens.accessToken)
    localStorage.setItem('refreshToken', tokens.refreshToken)
    if (tokens.orinId) {
      localStorage.setItem('orinId', tokens.orinId)
    }
    this.setTokenExpiry(tokens.accessTokenExpiresIn)
    this.scheduleTokenRefresh()
  }

  // Get access token
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken')
  }

  // Get refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken')
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getAccessToken()
    const expiryTime = this.getTokenExpiryTime()
    
    if (!token || !expiryTime) return false
    
    // Check if token is expired
    return Date.now() < expiryTime
  }

  // Refresh access token
  async refreshAccessToken(): Promise<TokenResponse> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    this.refreshPromise = fetch(getApiUrl('/api/qr/token/refresh'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken })
    })
      .then(async response => {
        if (!response.ok) {
          throw new Error('Token refresh failed')
        }
        const tokens: TokenResponse = await response.json()
        this.storeTokens(tokens)
        return tokens
      })
      .finally(() => {
        this.refreshPromise = null
      })

    return this.refreshPromise
  }

  // Make authenticated API request
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    // Ensure we have a valid token
    if (!this.isAuthenticated()) {
      try {
        await this.refreshAccessToken()
      } catch (error) {
        this.clearAuth()
        throw new Error('Authentication required')
      }
    }

    const accessToken = this.getAccessToken()
    if (!accessToken) {
      throw new Error('No access token available')
    }

    // Add authorization header
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`
    }

    const response = await fetch(url, {
      ...options,
      headers
    })

    // If 401, try to refresh token and retry
    if (response.status === 401) {
      try {
        await this.refreshAccessToken()
        const newToken = this.getAccessToken()
        
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`
          }
        })
      } catch (error) {
        this.clearAuth()
        throw new Error('Authentication failed')
      }
    }

    return response
  }

  // Clear authentication data
  clearAuth() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('orinId')
    localStorage.removeItem('tokenExpiry')
    
    if (this.tokenExpiryTimer) {
      clearTimeout(this.tokenExpiryTimer)
      this.tokenExpiryTimer = null
    }
  }

  // Login
  async login(email: string, password: string): Promise<TokenResponse> {
    const response = await fetch(getApiUrl('/api/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Login failed')
    }

    const tokens: TokenResponse = await response.json()
    this.storeTokens(tokens)
    return tokens
  }

  // Signup
  async signup(email: string, password: string): Promise<void> {
    const response = await fetch(getApiUrl('/api/auth/signup'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Signup failed')
    }
  }

  // Logout
  logout() {
    this.clearAuth()
  }
}

// Create singleton instance
const authService = new AuthService()

// Initialize token refresh on page load
if (typeof window !== 'undefined') {
  authService.initTokenRefresh()
}

export default authService