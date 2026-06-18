import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { Order } from '../models/Order.js'
import { Community } from '../models/Community.js'
import { redeemGift, createBulkOrder, advanceOrder } from '../services/orderService.js'

// GET /api/orders — scoped by role (super: all, admin: community, member: own)
export const listOrders = asyncHandler(async (req, res) => {
  let filter = {}
  if (req.user.role === 'member') filter = { memberId: req.user._id }
  else if (req.user.role !== 'super_admin') filter = { communityId: req.user.communityId }
  else if (req.query.communityId) filter = { communityId: req.query.communityId }
  if (req.query.status) filter.status = req.query.status

  const orders = await Order.find(filter).sort('-createdAt').populate('memberId', 'name')
  res.json({ success: true, count: orders.length, orders })
})

// GET /api/orders/:id
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('memberId', 'name')
  if (!order) throw ApiError.notFound('Order not found')
  if (req.user.role === 'member' && String(order.memberId?._id) !== String(req.user._id)) {
    throw ApiError.forbidden('Not your order')
  }
  res.json({ success: true, order })
})

// POST /api/orders/redeem  { giftId, deliveryTarget, address }  (member)
export const redeem = asyncHandler(async (req, res) => {
  const { giftId, deliveryTarget = 'home', address } = req.body
  const order = await redeemGift({ member: req.user, giftId, deliveryTarget, address })
  res.status(201).json({ success: true, order })
})

// POST /api/orders/bulk  { items:[{giftId, qty}], deliveryTarget, address }  (community admin)
export const bulk = asyncHandler(async (req, res) => {
  const communityId = req.user.role === 'super_admin' ? req.body.communityId : req.user.communityId
  const community = await Community.findById(communityId)
  if (!community) throw ApiError.notFound('Community not found')
  const order = await createBulkOrder({
    community,
    items: req.body.items || [],
    deliveryTarget: req.body.deliveryTarget || 'community',
    address: req.body.address,
  })
  res.status(201).json({ success: true, order })
})

// PATCH /api/orders/:id/advance  { courier?, trackingId? }  (super admin)
export const advance = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order) throw ApiError.notFound('Order not found')
  const updated = await advanceOrder(order, { courier: req.body.courier, trackingId: req.body.trackingId })
  res.json({ success: true, order: updated })
})
