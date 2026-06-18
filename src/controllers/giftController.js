import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { Gift } from '../models/Gift.js'
import { Config } from '../models/Config.js'
import { rupeesToPaise } from '../utils/money.js'

// GET /api/gifts — catalog (members see active gifts; super admin sees all)
export const listGifts = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'member' ? { status: { $ne: 'inactive' } } : {}
  if (req.query.category && req.query.category !== 'All') filter.category = req.query.category
  const gifts = await Gift.find(filter).sort('-createdAt')
  res.json({ success: true, count: gifts.length, gifts })
})

// POST /api/gifts  (super admin) — accepts costRupees and converts to paise
export const createGift = asyncHandler(async (req, res) => {
  const { name, imageUrl, category, segmentTags, pointsCost, costRupees, costPaise, stockQty } = req.body
  const gift = await Gift.create({
    name, imageUrl, category, segmentTags, pointsCost,
    costPaise: costPaise ?? rupeesToPaise(costRupees), stockQty: stockQty || 0,
  })
  res.status(201).json({ success: true, gift })
})

// PATCH /api/gifts/:id  (super admin)
export const updateGift = asyncHandler(async (req, res) => {
  const gift = await Gift.findById(req.params.id)
  if (!gift) throw ApiError.notFound('Gift not found')
  const { costRupees, ...rest } = req.body
  Object.assign(gift, rest)
  if (costRupees != null) gift.costPaise = rupeesToPaise(costRupees)
  await gift.save()
  res.json({ success: true, gift })
})

// POST /api/gifts/:id/restock  { qty }  (super admin)
export const restockGift = asyncHandler(async (req, res) => {
  const qty = Number(req.body.qty)
  if (!qty || qty <= 0) throw ApiError.badRequest('Enter a valid quantity')
  const gift = await Gift.findById(req.params.id)
  if (!gift) throw ApiError.notFound('Gift not found')
  gift.stockQty += qty
  await gift.save()
  res.json({ success: true, gift })
})

// DELETE /api/gifts/:id — soft-deactivate
export const deactivateGift = asyncHandler(async (req, res) => {
  const gift = await Gift.findById(req.params.id)
  if (!gift) throw ApiError.notFound('Gift not found')
  gift.status = 'inactive'
  await gift.save()
  res.json({ success: true, message: 'Gift deactivated' })
})

// GET /api/gifts/low-stock — low-stock alerts (super admin)
export const lowStock = asyncHandler(async (req, res) => {
  const cfg = await Config.getSingleton()
  const gifts = await Gift.find({ stockQty: { $lte: cfg.lowStockThreshold }, status: { $ne: 'inactive' } })
  res.json({ success: true, threshold: cfg.lowStockThreshold, count: gifts.length, gifts })
})
