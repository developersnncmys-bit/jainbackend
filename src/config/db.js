import mongoose from 'mongoose'
import { env } from './env.js'

let transactionsSupported = false
export const supportsTransactions = () => transactionsSupported

export async function connectDB() {
  mongoose.set('strictQuery', true)
  const conn = await mongoose.connect(env.mongoUri)
  // Transactions require a replica set / mongos. Detect so services can fall back.
  const isReplSet = !!conn.connection.client?.topology?.s?.description?.type?.match(/ReplicaSet|Sharded/i)
  transactionsSupported = isReplSet
  console.log(`✓ MongoDB connected: ${conn.connection.host}/${conn.connection.name}` +
    ` (transactions ${transactionsSupported ? 'enabled' : 'disabled — standalone'})`)
  return conn
}
