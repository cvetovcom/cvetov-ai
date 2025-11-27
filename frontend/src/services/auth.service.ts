/**
 * Authentication Service
 * Manages JWT tokens and authentication flow
 */

interface AuthTokens {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
}

class AuthService {
  private static instance: AuthService
  private tokens: AuthTokens | null = null
  private readonly TOKEN_KEY = 'cvetov_auth_tokens'
  private readonly IS_DEV = process.env.NODE_ENV === 'development'

  private constructor() {
    // Clear tokens on page load for security
    // Each session should get a fresh token
    this.clearTokens()
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  /**
   * Load tokens from localStorage
   */
  private loadTokens(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(this.TOKEN_KEY)
      if (stored) {
        this.tokens = JSON.parse(stored)

        // Check if token is expired
        if (this.tokens?.expiresAt && this.tokens.expiresAt < Date.now()) {
          this.clearTokens()
        }
      }
    } catch (error) {
      console.error('Error loading auth tokens:', error)
      this.clearTokens()
    }
  }

  /**
   * Save tokens to localStorage
   */
  private saveTokens(): void {
    if (typeof window === 'undefined') return

    try {
      if (this.tokens) {
        localStorage.setItem(this.TOKEN_KEY, JSON.stringify(this.tokens))
      } else {
        localStorage.removeItem(this.TOKEN_KEY)
      }
    } catch (error) {
      console.error('Error saving auth tokens:', error)
    }
  }

  /**
   * Login with credentials or get anonymous token
   * Always fetches real tokens from the API
   */
  public async login(username?: string, password?: string): Promise<void> {
    try {
      // Always get anonymous token from API (both dev and production)
      if (!username || !password) {
        console.log('Fetching anonymous token from API...')

        // Use proxy route to avoid CORS issues
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const response = await fetch(`${API_URL}/api/auth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({}) // Send empty JSON object to satisfy Fastify
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Failed to get anonymous token:', response.status, errorText)
          throw new Error(`Failed to get anonymous token: ${response.status}`)
        }

        const data = await response.json()
        console.log('Received token data:', {
          hasAccessToken: !!data.access_token,
          expiresIn: data.expires_in
        })

        this.tokens = {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: Date.now() + (data.expires_in || 3600) * 1000 // Convert seconds to milliseconds
        }

        this.saveTokens()
        console.log('Token saved successfully')
        return
      }

      // With credentials, call the auth API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })

      if (!response.ok) {
        throw new Error('Authentication failed')
      }

      const data = await response.json()

      this.tokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at || Date.now() + 60 * 60 * 1000 // Default 1 hour
      }

      this.saveTokens()
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  /**
   * Get current access token
   * Always fetches from API if not present
   */
  public async getAccessToken(): Promise<string> {
    console.log('getAccessToken called, current tokens:', {
      hasToken: !!this.tokens?.accessToken,
      expiresAt: this.tokens?.expiresAt,
      isExpired: this.tokens?.expiresAt ? this.tokens.expiresAt < Date.now() : null
    })

    // Check if token exists and is not expired
    if (this.tokens?.accessToken) {
      if (!this.tokens.expiresAt || this.tokens.expiresAt > Date.now()) {
        console.log('Returning existing valid token')
        return this.tokens.accessToken
      }

      // Token is expired, try to refresh
      if (this.tokens.refreshToken) {
        console.log('Token expired, attempting refresh...')
        await this.refreshToken()
        if (this.tokens?.accessToken) {
          return this.tokens.accessToken
        }
      }
    }

    // Always fetch a new token from API
    console.log('No valid token, fetching new one from API...')
    await this.login()
    if (this.tokens?.accessToken) {
      console.log('New token obtained successfully')
      return this.tokens.accessToken
    }

    // If still no token, throw error
    console.error('Failed to obtain authentication token')
    throw new Error('No valid authentication token')
  }

  /**
   * Refresh the access token using refresh token
   */
  public async refreshToken(): Promise<void> {
    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refresh_token: this.tokens.refreshToken
        })
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()

      this.tokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || this.tokens.refreshToken,
        expiresAt: data.expires_at || Date.now() + 60 * 60 * 1000
      }

      this.saveTokens()
    } catch (error) {
      console.error('Token refresh error:', error)
      this.clearTokens()
      throw error
    }
  }

  /**
   * Get authorization header
   */
  public async getAuthHeader(): Promise<{ Authorization: string }> {
    const token = await this.getAccessToken()
    return {
      Authorization: `Bearer ${token}`
    }
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return !!(this.tokens?.accessToken &&
             (!this.tokens.expiresAt || this.tokens.expiresAt > Date.now()))
  }

  /**
   * Logout and clear tokens
   */
  public logout(): void {
    this.clearTokens()
  }

  /**
   * Clear all tokens
   */
  private clearTokens(): void {
    this.tokens = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY)
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance()