import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { ActivityTemplate } from '../models/ActivityTemplate.js'

// GET /api/templates — master activity templates (readable by any admin)
export const listTemplates = asyncHandler(async (_req, res) => {
  const templates = await ActivityTemplate.find().sort('-createdAt')
  res.json({ success: true, count: templates.length, templates })
})

// POST /api/templates  (super admin)
export const createTemplate = asyncHandler(async (req, res) => {
  const { title, description, defaultPoints, completionMode, segmentTags } = req.body
  const template = await ActivityTemplate.create({ title, description, defaultPoints, completionMode, segmentTags })
  res.status(201).json({ success: true, template })
})

// PATCH /api/templates/:id  (super admin)
export const updateTemplate = asyncHandler(async (req, res) => {
  const template = await ActivityTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  if (!template) throw ApiError.notFound('Template not found')
  res.json({ success: true, template })
})

// DELETE /api/templates/:id  (super admin)
export const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await ActivityTemplate.findByIdAndDelete(req.params.id)
  if (!template) throw ApiError.notFound('Template not found')
  res.json({ success: true, message: 'Template removed' })
})
