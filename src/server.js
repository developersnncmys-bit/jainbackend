import { createApp } from './app.js'
import { connectDB } from './config/db.js'
import { env } from './config/env.js'

async function start() {
  try {
    await connectDB()
    const app = createApp()
    app.listen(env.port, () => {
      console.log(`✓ Jain Patashala API running on http://localhost:${env.port} (${env.nodeEnv})`)
    })
  } catch (err) {
    console.error('✗ Failed to start server:', err.message)
    process.exit(1)
  }
}

start()
