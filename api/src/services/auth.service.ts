/**
 * Authentication Service
 * Manages JWT tokens for API authentication
 */

import fetch from 'node-fetch'

interface AnonymousToken {
  access_token: string
}

interface TokenInfo {
  token: string
  expiresAt: Date
}

export class AuthService {
  private anonymousToken: TokenInfo | null = null
  private readonly API_URL = process.env.BACKEND_API_URL || 'https://site.cvetov24.ru/api'

  /**
   * Get a valid anonymous access token
   * Automatically refreshes if expired or not available
   */
  async getAnonymousToken(): Promise<string> {
    // Check if we have a valid token
    if (this.anonymousToken && this.anonymousToken.expiresAt > new Date()) {
      console.log('[AuthService] Using cached anonymous token')
      return this.anonymousToken.token
    }

    console.log('[AuthService] Fetching new anonymous token...')

    try {
      const response = await fetch(`${this.API_URL}/v2/registration/anonym_access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to get anonymous token: ${response.status} ${response.statusText}`)
      }

      const data = await response.json() as AnonymousToken

      if (!data.access_token) {
        throw new Error('No access_token in response')
      }

      // Parse JWT to get expiration time
      const tokenParts = data.access_token.split('.')
      if (tokenParts.length !== 3) {
        throw new Error('Invalid JWT format')
      }

      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString())
      const expiresAt = new Date(payload.exp * 1000)

      // Store token with 1 minute safety margin before expiration
      const safeExpiresAt = new Date(expiresAt.getTime() - 60000)

      this.anonymousToken = {
        token: data.access_token,
        expiresAt: safeExpiresAt
      }

      console.log('[AuthService] Got anonymous token, expires at:', expiresAt.toISOString())

      return data.access_token
    } catch (error) {
      console.error('[AuthService] Error getting anonymous token:', error)
      throw new Error(`Failed to get anonymous token: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Clear cached token (useful for testing or forcing refresh)
   */
  clearCache() {
    this.anonymousToken = null
    console.log('[AuthService] Token cache cleared')
  }
}

// Singleton instance
export const authService = new AuthService()