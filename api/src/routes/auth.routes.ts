/**
 * Auth Routes
 * Proxy for authentication services
 */

import { FastifyPluginAsync } from 'fastify'

const authRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /auth/token
   * Get anonymous access token (proxy to cvetov24.ru API)
   */
  fastify.post('/auth/token', async (request, reply) => {
    try {
      console.log('[Auth] Proxying token request to cvetov24.ru API')

      // Proxy request to cvetov24.ru API - simple fetch without SSL verification
      const response = await fetch('https://site.cvetov24.ru/api/v2/registration/anonym_access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        body: JSON.stringify({}) // Empty body for anonymous token request
      })

      console.log('[Auth] Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log('[Auth] Error response:', errorText)
        return reply.code(response.status).send({
          error: 'TokenFetchError',
          message: 'Failed to get anonymous token',
          details: errorText
        })
      }

      const data = await response.json()
      console.log('[Auth] Token received successfully')

      // Return token data
      return reply.code(200).send(data)
    } catch (error) {
      fastify.log.error(error)
      console.log('[Auth] Fetch error:', error)

      return reply.code(500).send({
        error: 'InternalServerError',
        message: error instanceof Error ? error.message : 'Failed to get token'
      })
    }
  })
}

export default authRoutes