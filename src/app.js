import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env.js'
import routes from './routes/index.js'
import { notFound, errorHandler } from './middleware/error.js'

export function createApp() {
  const app = express()

  app.use(helmet())
  // Allow: configured origins, localhost (any port), and any *.vercel.app
  // deployment — so the hosted frontends work without re-listing each domain.
  const corsOrigin = (origin, cb) => {
    if (!origin) return cb(null, true) // same-origin / curl / server-to-server
    if (env.clientOrigins.includes('*') || env.clientOrigins.includes(origin)) return cb(null, true)
    try {
      const host = new URL(origin).hostname
      if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.vercel.app')) return cb(null, true)
    } catch {}
    return cb(null, false)
  }
  app.use(cors({ origin: corsOrigin, credentials: true }))
  app.use(express.json({ limit: '2mb' }))
  app.use(express.urlencoded({ extended: true }))
  if (env.nodeEnv !== 'test') app.use(morgan('dev'))

  app.get('/', (_req, res) =>
    res.json({ success: true, name: 'Jain Patashala API', docs: '/api', health: '/health' })
  )
  app.get('/health', (_req, res) => res.json({ success: true, status: 'ok' }))
  app.use('/api', routes)

  app.use(notFound)
  app.use(errorHandler)
  return app
}
