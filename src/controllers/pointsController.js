import { asyncHandler } from '../utils/asyncHandler.js'
import { PointsLedger } from '../models/PointsLedger.js'
import { getBalance } from '../services/pointsService.js'

// GET /api/points/ledger — member's own earn/redeem history
export const myLedger = asyncHandler(async (req, res) => {
  const memberId = req.user.role === 'member' ? req.user._id : (req.query.memberId || req.user._id)
  const entries = await PointsLedger.find({ memberId }).sort('-createdAt')
  res.json({ success: true, count: entries.length, entries })
})

// GET /api/points/balance
export const myBalance = asyncHandler(async (req, res) => {
  const memberId = req.user.role === 'member' ? req.user._id : (req.query.memberId || req.user._id)
  const balance = await getBalance(memberId)
  res.json({ success: true, balance })
})
