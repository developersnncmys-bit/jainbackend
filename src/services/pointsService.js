import mongoose from 'mongoose'
import { PointsLedger } from '../models/PointsLedger.js'
import { opt } from '../utils/withTransaction.js'

// The member's balance is ALWAYS the sum of the ledger (SOW §6) — never stored.
export async function getBalance(memberId) {
  const [row] = await PointsLedger.aggregate([
    { $match: { memberId: new mongoose.Types.ObjectId(String(memberId)) } },
    { $group: { _id: null, total: { $sum: '$points' } } },
  ])
  return row?.total || 0
}

// Append an earn (+) or redeem (-) transaction.
export async function addLedgerEntry(
  { memberId, communityId, type, points, title, refType, refId },
  session
) {
  const [entry] = await PointsLedger.create(
    [{ memberId, communityId, type, points, title, refType, refId }],
    opt(session)
  )
  return entry
}
