// Vercel serverless entry point.
// An Express app can't use app.listen() on Vercel — instead we export a handler
// that (1) connects to MongoDB once and caches the connection across warm
// invocations, then (2) delegates the request to the Express app.
import { createApp } from '../src/app.js'
import { connectDB } from '../src/config/db.js'

let appInstance
let dbPromise

export default async function handler(req, res) {
  try {
    if (!dbPromise) {
      // Cache the connection promise so concurrent/warm invocations reuse it.
      dbPromise = connectDB().catch((err) => {
        dbPromise = null // allow a retry on the next request
        throw err
      })
    }
    await dbPromise
    if (!appInstance) appInstance = createApp()
    return appInstance(req, res)
  } catch (err) {
    console.error('Serverless init failed:', err)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      success: false,
      message: 'Server initialization failed. Check MONGO_URI / network access.',
    }))
  }
}
