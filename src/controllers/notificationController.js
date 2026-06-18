import { asyncHandler } from '../utils/asyncHandler.js'
import { Notification } from '../models/Notification.js'

// GET /api/notifications — addressed to the user directly, their role, or their community
export const listNotifications = asyncHandler(async (req, res) => {
  const or = [{ userId: req.user._id }, { role: req.user.role }]
  if (req.user.communityId) or.push({ communityId: req.user.communityId, role: req.user.role })
  const notifications = await Notification.find({ $or: or }).sort('-createdAt').limit(50)
  const unread = notifications.filter((n) => !n.read).length
  res.json({ success: true, unread, notifications })
})

// PATCH /api/notifications/read-all
export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { $or: [{ userId: req.user._id }, { role: req.user.role }] },
    { read: true }
  )
  res.json({ success: true, message: 'All marked read' })
})

// PATCH /api/notifications/:id/read
export const markRead = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { read: true })
  res.json({ success: true })
})
