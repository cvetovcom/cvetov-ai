/**
 * Session Service
 * Manages conversation sessions with history and temporary cart
 */

import { randomUUID } from 'crypto'
import type { TempCart } from '../types/index.js'
import { cartService } from './cart.service.js'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Session {
  id: string
  userId?: string // JWT user UUID if available
  conversationHistory: Message[]
  tempCart: TempCart
  userCity?: string
  userLocation?: {
    latitude: number
    longitude: number
  }
  createdAt: Date
  updatedAt: Date
  expiresAt: Date
}

export class SessionService {
  private sessions: Map<string, Session> = new Map()
  private readonly SESSION_TTL = 1000 * 60 * 60 * 24 // 24 hours

  constructor() {
    // Clean up expired sessions every hour
    setInterval(() => this.cleanupExpiredSessions(), 1000 * 60 * 60)
  }

  /**
   * Create new session
   */
  createSession(userId?: string): Session {
    const sessionId = randomUUID()
    const now = new Date()

    const session: Session = {
      id: sessionId,
      userId,
      conversationHistory: [],
      tempCart: cartService.clearTempCart(),
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + this.SESSION_TTL),
    }

    this.sessions.set(sessionId, session)

    return session
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId)

    if (!session) {
      return null
    }

    // Check if expired
    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionId)
      return null
    }

    return session
  }

  /**
   * Get or create session
   */
  getOrCreateSession(sessionId?: string, userId?: string): Session {
    if (sessionId) {
      const existing = this.getSession(sessionId)
      if (existing) {
        // Update expiration
        existing.expiresAt = new Date(Date.now() + this.SESSION_TTL)
        existing.updatedAt = new Date()
        console.log('[SessionService] Found existing session:', sessionId)
        return existing
      }
      // Create new session but with the requested ID to maintain consistency
      console.log('[SessionService] Session not found, creating new with ID:', sessionId)
      const now = new Date()
      const session: Session = {
        id: sessionId, // Use the requested sessionId instead of generating new
        userId,
        conversationHistory: [],
        tempCart: cartService.clearTempCart(),
        createdAt: now,
        updatedAt: now,
        expiresAt: new Date(now.getTime() + this.SESSION_TTL),
      }
      this.sessions.set(sessionId, session)
      return session
    }

    console.log('[SessionService] No sessionId provided, creating new session')
    return this.createSession(userId)
  }

  /**
   * Update session conversation history
   */
  updateConversationHistory(
    sessionId: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): void {
    const session = this.getSession(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    session.conversationHistory = messages.map(m => ({
      ...m,
      timestamp: new Date(),
    }))
    session.updatedAt = new Date()
  }

  /**
   * Update session temporary cart
   */
  updateTempCart(sessionId: string, tempCart: TempCart): void {
    const session = this.getSession(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    session.tempCart = tempCart
    session.updatedAt = new Date()
  }

  /**
   * Set user location (from geolocation)
   */
  setUserLocation(
    sessionId: string,
    location: { latitude: number; longitude: number }
  ): void {
    const session = this.getSession(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    session.userLocation = location
    session.updatedAt = new Date()
  }

  /**
   * Set user city (from user input or city search)
   */
  setUserCity(sessionId: string, city: string): void {
    const session = this.getSession(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    session.userCity = city
    session.updatedAt = new Date()
  }

  /**
   * Clear user location data (city and coordinates)
   */
  clearLocationData(sessionId: string): void {
    const session = this.getSession(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    session.userCity = undefined
    session.userLocation = undefined
    session.updatedAt = new Date()
  }

  /**
   * Delete session
   */
  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId)
  }

  /**
   * Clear expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = new Date()
    let cleaned = 0

    for (const [id, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(id)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`[SessionService] Cleaned up ${cleaned} expired sessions`)
    }
  }

  /**
   * Get session stats (for monitoring)
   */
  getStats() {
    return {
      activeSessions: this.sessions.size,
      sessions: Array.from(this.sessions.values()).map(s => ({
        id: s.id,
        userId: s.userId,
        messageCount: s.conversationHistory.length,
        cartItemsCount: s.tempCart.items_count,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
      })),
    }
  }
}

// Singleton instance
export const sessionService = new SessionService()
