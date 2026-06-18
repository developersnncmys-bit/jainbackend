import { asyncHandler } from '../utils/asyncHandler.js'
import { Config } from '../models/Config.js'

// GET /api/config — platform configuration (SOW §7.3.7)
export const getConfig = asyncHandler(async (_req, res) => {
  const config = await Config.getSingleton()
  res.json({ success: true, config })
})

// PATCH /api/config  (super admin)
export const updateConfig = asyncHandler(async (req, res) => {
  const config = await Config.getSingleton()
  const { pointToRupee, lowStockThreshold, segments, notificationTemplates } = req.body
  if (pointToRupee != null) config.pointToRupee = pointToRupee
  if (lowStockThreshold != null) config.lowStockThreshold = lowStockThreshold
  if (Array.isArray(segments)) config.segments = segments
  if (notificationTemplates) config.notificationTemplates = { ...config.notificationTemplates, ...notificationTemplates }
  await config.save()
  res.json({ success: true, config })
})
