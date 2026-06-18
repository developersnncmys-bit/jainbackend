import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { ContentItem } from '../models/ContentItem.js'

// GET /api/content — global master library + the member/admin's community content.
export const listContent = asyncHandler(async (req, res) => {
  const or = [{ scope: 'global' }]
  const communityId = req.user.communityId || req.query.communityId
  if (communityId) or.push({ scope: 'community', communityId })
  const filter = req.user.role === 'super_admin' && !communityId ? {} : { $or: or }
  if (req.query.type) filter.type = req.query.type
  const items = await ContentItem.find(filter).sort('-createdAt')
  res.json({ success: true, count: items.length, items })
})

// GET /api/content/:id
export const getContent = asyncHandler(async (req, res) => {
  const item = await ContentItem.findById(req.params.id)
  if (!item) throw ApiError.notFound('Content not found')
  res.json({ success: true, item })
})

// POST /api/content
export const createContent = asyncHandler(async (req, res) => {
  const { title, type, body, mediaUrl, minutes, segmentTags } = req.body
  const isSuper = req.user.role === 'super_admin'
  const item = await ContentItem.create({
    title, type, body, mediaUrl, minutes, segmentTags,
    scope: isSuper ? 'global' : 'community',
    communityId: isSuper ? undefined : req.user.communityId,
    createdBy: req.user._id,
  })
  res.status(201).json({ success: true, item })
})

// PATCH /api/content/:id
export const updateContent = asyncHandler(async (req, res) => {
  const item = await ContentItem.findById(req.params.id)
  if (!item) throw ApiError.notFound('Content not found')
  if (req.user.role !== 'super_admin' && String(item.communityId) !== String(req.user.communityId)) {
    throw ApiError.forbidden('Cannot edit content from another scope')
  }
  Object.assign(item, req.body)
  await item.save()
  res.json({ success: true, item })
})

// DELETE /api/content/:id
export const deleteContent = asyncHandler(async (req, res) => {
  const item = await ContentItem.findById(req.params.id)
  if (!item) throw ApiError.notFound('Content not found')
  if (req.user.role !== 'super_admin' && String(item.communityId) !== String(req.user.communityId)) {
    throw ApiError.forbidden('Cannot delete content from another scope')
  }
  await item.deleteOne()
  res.json({ success: true, message: 'Content removed' })
})
