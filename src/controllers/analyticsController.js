import { asyncHandler } from '../utils/asyncHandler.js'
import { Community } from '../models/Community.js'
import { User } from '../models/User.js'
import { Order } from '../models/Order.js'
import { Gift } from '../models/Gift.js'
import { PointsLedger } from '../models/PointsLedger.js'
import { WalletTransaction } from '../models/WalletTransaction.js'

// GET /api/analytics/platform  (super admin) — SOW §7.3.8
export const platformAnalytics = asyncHandler(async (_req, res) => {
  const [communities, members, openOrders, lowStock] = await Promise.all([
    Community.countDocuments(),
    User.countDocuments({ role: 'member' }),
    Order.countDocuments({ status: { $ne: 'Delivered' } }),
    Gift.countDocuments({ stockQty: { $lte: 10 }, status: { $ne: 'inactive' } }),
  ])

  // Revenue = sum of successful top-ups (what communities paid).
  const [rev] = await WalletTransaction.aggregate([
    { $match: { type: 'topup', status: 'success' } },
    { $group: { _id: null, total: { $sum: '$amountPaise' } } },
  ])

  // Gift demand for inventory planning — units redeemed per gift.
  const giftDemand = await Order.aggregate([
    { $unwind: '$items' },
    { $group: { _id: '$items.name', redeemed: { $sum: '$items.qty' } } },
    { $sort: { redeemed: -1 } },
    { $limit: 10 },
  ])

  // Top communities by member count.
  const topCommunities = await User.aggregate([
    { $match: { role: 'member' } },
    { $group: { _id: '$communityId', members: { $sum: 1 } } },
    { $sort: { members: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'communities', localField: '_id', foreignField: '_id', as: 'community' } },
    { $unwind: '$community' },
    { $project: { members: 1, name: '$community.name', type: '$community.type' } },
  ])

  res.json({
    success: true,
    totals: { communities, members, openOrders, lowStock, revenuePaise: rev?.total || 0 },
    giftDemand: giftDemand.map((g) => ({ name: g._id, redeemed: g.redeemed })),
    topCommunities,
  })
})

// GET /api/analytics/community  — community admin engagement report (SOW §7.2.8)
export const communityReport = asyncHandler(async (req, res) => {
  const communityId = req.user.role === 'super_admin' ? req.query.communityId : req.user.communityId

  const [issued] = await PointsLedger.aggregate([
    { $match: { type: 'earn' } },
    { $group: { _id: null, total: { $sum: '$points' } } },
  ])
  const [redeemed] = await PointsLedger.aggregate([
    { $match: { type: 'redeem' } },
    { $group: { _id: null, total: { $sum: '$points' } } },
  ])
  const members = await User.countDocuments({ role: 'member', communityId })

  // Most active members by points earned.
  const topMembers = await PointsLedger.aggregate([
    { $match: { type: 'earn', communityId: req.user.communityId || undefined } },
    { $group: { _id: '$memberId', points: { $sum: '$points' } } },
    { $sort: { points: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'member' } },
    { $unwind: '$member' },
    { $project: { points: 1, name: '$member.name' } },
  ])

  res.json({
    success: true,
    members,
    pointsIssued: issued?.total || 0,
    pointsRedeemed: -(redeemed?.total || 0),
    topMembers,
  })
})
