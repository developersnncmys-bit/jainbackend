import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { Community } from '../models/Community.js'
import { User } from '../models/User.js'
import { WalletTransaction } from '../models/WalletTransaction.js'
import { AuditLog } from '../models/AuditLog.js'
import { rupeesToPaise } from '../utils/money.js'

const makeCode = (name) =>
  name.replace(/[^a-zA-Z]/g, '').slice(0, 7).toUpperCase() + Math.floor(10 + Math.random() * 89)

// GET /api/communities  (super admin: all; others: their own)
export const listCommunities = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'super_admin' ? {} : { _id: req.user.communityId }
  const communities = await Community.find(filter).sort('-createdAt')
  res.json({ success: true, count: communities.length, communities })
})

// GET /api/communities/:id
export const getCommunity = asyncHandler(async (req, res) => {
  const community = await Community.findById(req.params.id)
  if (!community) throw ApiError.notFound('Community not found')
  res.json({ success: true, community })
})

// POST /api/communities  (super admin) — onboard + issue Principal login.
export const onboardCommunity = asyncHandler(async (req, res) => {
  const { name, type, city, address, principalName, principalEmail, principalPassword } = req.body

  // Onboarded by the super admin directly, so it goes live immediately — its
  // invite code works and members can join right away (no separate approval).
  const community = await Community.create({
    name, type, city, address, inviteCode: makeCode(name), status: 'active',
  })

  let principal = null
  if (principalEmail && principalPassword) {
    principal = await User.create({
      name: principalName || `${name} Principal`,
      email: principalEmail,
      password: principalPassword,
      role: 'principal',
      communityId: community._id,
    })
    community.principalUserId = principal._id
    await community.save()
  }

  await AuditLog.create({ actorId: req.user._id, actorRole: req.user.role, communityId: community._id, action: 'community.onboard', target: community.name })
  res.status(201).json({ success: true, community, principal })
})

// PATCH /api/communities/:id/status  (super admin) — approve / suspend / activate
export const setCommunityStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  if (!['pending', 'active', 'suspended'].includes(status)) throw ApiError.badRequest('Invalid status')
  const community = await Community.findByIdAndUpdate(req.params.id, { status }, { new: true })
  if (!community) throw ApiError.notFound('Community not found')
  await AuditLog.create({ actorId: req.user._id, actorRole: req.user.role, communityId: community._id, action: `community.${status}` })
  res.json({ success: true, community })
})

// PATCH /api/communities/:id/pricing  (super admin)
export const setPricing = asyncHandler(async (req, res) => {
  const { pointToRupee, subscriptionPaise } = req.body
  const community = await Community.findById(req.params.id)
  if (!community) throw ApiError.notFound('Community not found')
  if (pointToRupee != null) community.pricing.pointToRupee = pointToRupee
  if (subscriptionPaise != null) community.pricing.subscriptionPaise = subscriptionPaise
  await community.save()
  res.json({ success: true, community })
})

// POST /api/communities/:id/topup  (principal or super admin) — Razorpay top-up
export const topUpWallet = asyncHandler(async (req, res) => {
  const { amountRupees, gateway = 'razorpay', refId } = req.body
  const amountPaise = rupeesToPaise(amountRupees)
  if (!amountPaise || amountPaise <= 0) throw ApiError.badRequest('Enter a valid amount')

  const community = await Community.findById(req.params.id)
  if (!community) throw ApiError.notFound('Community not found')

  community.giftWalletBalancePaise += amountPaise
  await community.save()
  const txn = await WalletTransaction.create({
    communityId: community._id, type: 'topup', amountPaise,
    balanceAfterPaise: community.giftWalletBalancePaise,
    title: 'Gift Wallet top-up', refType: 'razorpay', gateway, status: 'success', refId,
  })
  res.status(201).json({ success: true, community, transaction: txn })
})
