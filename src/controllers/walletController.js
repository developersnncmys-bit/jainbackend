import { asyncHandler } from '../utils/asyncHandler.js'
import { WalletTransaction } from '../models/WalletTransaction.js'
import { Community } from '../models/Community.js'

// GET /api/wallet/transactions — Gift Wallet movements for a community
export const listTransactions = asyncHandler(async (req, res) => {
  const communityId = req.user.role === 'super_admin' ? req.query.communityId : req.user.communityId
  const filter = communityId ? { communityId } : {}
  const transactions = await WalletTransaction.find(filter).sort('-createdAt').limit(200)
  res.json({ success: true, count: transactions.length, transactions })
})

// GET /api/wallet/balance — current Gift Wallet balance for a community
export const walletBalance = asyncHandler(async (req, res) => {
  const communityId = req.user.role === 'super_admin' ? req.query.communityId : req.user.communityId
  const community = await Community.findById(communityId)
  res.json({ success: true, balancePaise: community?.giftWalletBalancePaise || 0 })
})
