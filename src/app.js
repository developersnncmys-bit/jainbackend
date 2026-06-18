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
  app.use(cors({
    origin: env.clientOrigins.includes('*') ? true : env.clientOrigins,
    credentials: true,
  }))
  app.use(express.json({ limit: '2mb' }))
  app.use(express.urlencoded({ extended: true }))
  if (env.nodeEnv !== 'test') app.use(morgan('dev'))

  app.get('/health', (_req, res) => res.json({ success: true, status: 'ok' }))
  app.use('/api', routes)

  app.use(notFound)
  app.use(errorHandler)
  return app
}
