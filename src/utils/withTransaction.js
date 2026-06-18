import mongoose from 'mongoose'
import { supportsTransactions } from '../config/db.js'

// Runs `fn(session)` inside a MongoDB transaction when the deployment supports
// it (replica set / Atlas), per SOW §14 (points + wallet debits must be ACID).
// On a standalone mongod it falls back to running `fn(null)` without a session,
// so the API still works in local/dev environments.
export async function withTransaction(fn) {
  if (!supportsTransactions()) {
    return fn(null)
  }
  const session = await mongoose.startSession()
  try {
    let result
    await session.withTransaction(async () => {
      result = await fn(session)
    })
    return result
  } finally {
    session.endSession()
  }
}

// Helper: pass `{ session }` to queries only when a session exists.
export const opt = (session) => (session ? { session } : {})
