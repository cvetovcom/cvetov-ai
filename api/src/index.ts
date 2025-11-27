import Fastify from 'fastify'
import cors from '@fastify/cors'
import 'dotenv/config'
import chatRoutes from './routes/chat.routes.js'
import authRoutes from './routes/auth.routes.js'
import { citiesCacheService } from './services/cities-cache.service.js'

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
})

// Register CORS
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3002',
  credentials: true,
})

// Health check endpoint
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// Register routes
await fastify.register(chatRoutes, { prefix: '/api' })
await fastify.register(authRoutes, { prefix: '/api' })

// Start server
const start = async () => {
  try {
    // Initialize cities cache
    await citiesCacheService.initialize()

    const port = parseInt(process.env.PORT || '8000', 10)
    const host = process.env.HOST || '0.0.0.0'

    await fastify.listen({ port, host })
    fastify.log.info(`🚀 API Server listening on http://${host}:${port}`)
    fastify.log.info(`📝 API Documentation: http://${host}:${port}/api/chat`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
