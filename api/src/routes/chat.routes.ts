/**
 * Chat Routes
 * API endpoints for AI chat functionality
 */

import { FastifyPluginAsync } from 'fastify'
import { claudeService } from '../services/claude.service.js'
import { sessionService } from '../services/session.service.js'
import { BackendAPIError } from '../services/backend-api.service.js'

interface ChatRequestBody {
  message: string
  session_id?: string
  city?: string
  location?: {
    latitude: number
    longitude: number
  }
}

interface ChatResponse {
  message: string
  session_id: string
  cart: {
    items_count: number
    total_price: number
  }
  products?: Array<{
    id: string
    name: string
    price: number
    old_price?: number
    image_url: string
    description?: string
    in_stock: boolean
    shop_name?: string
  }>
}

const chatRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /chat
   * Send message to AI and get response
   */
  fastify.post<{
    Body: ChatRequestBody
  }>('/chat', async (request, reply) => {
    try {
      const { message, session_id, city, location } = request.body

      console.log('[ChatRoute] Request body:', {
        hasMessage: !!message,
        session_id: session_id || 'NOT_PROVIDED',
        city: city || 'NOT_PROVIDED',
        hasLocation: !!location
      })

      // Validate message
      if (!message || message.trim().length === 0) {
        return reply.code(400).send({
          error: 'ValidationError',
          message: 'Message cannot be empty',
        })
      }

      // Get JWT token from header (optional for development)
      const authHeader = request.headers.authorization
      let jwt = ''
      if (authHeader && authHeader.startsWith('Bearer ')) {
        jwt = authHeader.substring(7)
      }
      // For development, create a dummy JWT if not provided
      if (!jwt) {
        jwt = 'dev-token-' + Date.now()
      }

      // Get or create session
      const session = sessionService.getOrCreateSession(session_id)
      console.log('[ChatRoute] Session state:', {
        id: session.id,
        session_id_from_request: session_id,
        userCity: session.userCity,
        hasLocation: !!session.userLocation,
        messageCount: session.conversationHistory.length,
        isNewSession: session_id !== session.id
      })

      // REMOVED: Automatic city clearing logic
      // This was causing issues by clearing city when product keywords were mentioned
      // Now city will be maintained in session until explicitly changed

      // Update location if provided
      if (location) {
        sessionService.setUserLocation(session.id, location)
      } else if (city) {
        // Convert city name to slug for API compatibility
        // For now, just set the city as-is - AI will need to search for it
        sessionService.setUserCity(session.id, city)
      }

      // Process message with Claude
      const result = await claudeService.chat(
        message,
        jwt,
        session.conversationHistory.map(m => ({
          role: m.role,
          content: m.content,
        })),
        session.tempCart,
        session.userCity,
        session.userLocation
      )

      // Update session
      sessionService.updateConversationHistory(session.id, result.conversationHistory)
      sessionService.updateTempCart(session.id, result.tempCart)

      // Update city if Claude set it
      if (result.updatedCity) {
        sessionService.setUserCity(session.id, result.updatedCity)
        console.log('[ChatRoute] City updated to:', result.updatedCity)
      }

      // Log products to debug
      if (result.products && result.products.length > 0) {
        console.log('[ChatRoute] First product from ClaudeService:', JSON.stringify(result.products[0], null, 2))
      }

      // Log customer info to debug
      if (result.customerInfo) {
        console.log('[ChatRoute] Customer info from ClaudeService:', result.customerInfo)
      } else {
        console.log('[ChatRoute] No customer info in result')
      }

      // Return response
      const response: ChatResponse & { customerInfo?: any } = {
        message: result.message,
        session_id: session.id,
        cart: {
          items_count: result.tempCart.items_count,
          total_price: result.tempCart.total_price,
        },
        products: result.products?.map((product: any) => ({
          id: product.guid || product.uuid,
          name: product.name,
          price: typeof product.price === 'object'
            ? product.price.final_price || product.price.base_price
            : product.price,
          old_price: product.old_price || undefined,
          image_url: product.main_image || product.preview_image?.url || '',
          description: product.description,
          in_stock: product.show_item !== false,
          shop_name: product.shop_name || product.shop?.name
        })),
        customerInfo: result.customerInfo
      }

      return reply.code(200).send(response)
    } catch (error) {
      fastify.log.error(error)

      if (error instanceof BackendAPIError) {
        // Backend API error
        return reply.code(error.statusCode || 500).send({
          error: error.errorResponse?.error || 'BackendError',
          message: error.message,
          details: error.errorResponse?.details,
        })
      }

      // Unknown error
      return reply.code(500).send({
        error: 'InternalServerError',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      })
    }
  })

  /**
   * GET /sessions/:id
   * Get session information
   */
  fastify.get<{
    Params: { id: string }
  }>('/sessions/:id', async (request, reply) => {
    const { id } = request.params

    const session = sessionService.getSession(id)

    if (!session) {
      return reply.code(404).send({
        error: 'NotFound',
        message: 'Session not found or expired',
      })
    }

    return reply.code(200).send({
      session_id: session.id,
      message_count: session.conversationHistory.length,
      cart: {
        items_count: session.tempCart.items_count,
        total_price: session.tempCart.total_price,
        items: session.tempCart.items,
      },
      city: session.userCity,
      has_location: !!session.userLocation,
      created_at: session.createdAt,
      updated_at: session.updatedAt,
      expires_at: session.expiresAt,
    })
  })

  /**
   * DELETE /sessions/:id
   * Delete session (clear conversation)
   */
  fastify.delete<{
    Params: { id: string }
  }>('/sessions/:id', async (request, reply) => {
    const { id } = request.params

    sessionService.deleteSession(id)

    return reply.code(200).send({
      success: true,
      message: 'Session deleted',
    })
  })

  /**
   * GET /sessions/stats
   * Get sessions statistics (for monitoring)
   */
  fastify.get('/sessions/stats', async (request, reply) => {
    const stats = sessionService.getStats()

    return reply.code(200).send(stats)
  })
}

export default chatRoutes
