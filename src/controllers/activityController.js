import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { Activity } from '../models/Activity.js'
import { ActivityTemplate } from '../models/ActivityTemplate.js'
import { ActivityCompletion } from '../models/ActivityCompletion.js'

const communityOf = (req) =>
  req.user.role === 'super_admin' ? (req.query.communityId || req.body.communityId) : req.user.communityId

// GET /api/activities — community admin view
export const listActivities = asyncHandler(async (req, res) => {
  const communityId = communityOf(req)
  const activities = await Activity.find({ communityId, status: 'active' }).sort('-createdAt')
  res.json({ success: true, count: activities.length, activities })
})

// POST /api/activities — create from a template or custom (SOW §7.2.4)
export const createActivity = asyncHandler(async (req, res) => {
  const communityId = communityOf(req)
  let { templateId, title, description, points, completionMode, contentId, dueDate, recurrence, targetSegment, targetMembers } = req.body

  if (templateId) {
    const tpl = await ActivityTemplate.findById(templateId)
    if (!tpl) throw ApiError.notFound('Template not found')
    title = title || tpl.title
    description = description || tpl.description
    points = points ?? tpl.defaultPoints
    completionMode = completionMode || tpl.completionMode
  }
  if (!title || points == null || !completionMode) {
    throw ApiError.badRequest('title, points and completionMode are required')
  }

  const activity = await Activity.create({
    communityId, templateId, title, description, points, completionMode, contentId,
    dueDate, recurrence: recurrence || 'none', targetSegment: targetSegment || 'All', targetMembers,
  })
  res.status(201).json({ success: true, activity })
})

// PATCH /api/activities/:id
export const updateActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id)
  if (!activity) throw ApiError.notFound('Activity not found')
  if (req.user.role !== 'super_admin' && String(activity.communityId) !== String(req.user.communityId)) {
    throw ApiError.forbidden('Cross-community access denied')
  }
  Object.assign(activity, req.body)
  await activity.save()
  res.json({ success: true, activity })
})

// DELETE /api/activities/:id — archive
export const archiveActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id)
  if (!activity) throw ApiError.notFound('Activity not found')
  if (req.user.role !== 'super_admin' && String(activity.communityId) !== String(req.user.communityId)) {
    throw ApiError.forbidden('Cross-community access denied')
  }
  activity.status = 'archived'
  await activity.save()
  res.json({ success: true, message: 'Activity archived' })
})

// GET /api/activities/feed — the member's assigned feed with per-member status
export const memberFeed = asyncHandler(async (req, res) => {
  const member = req.user
  const activities = await Activity.find({
    communityId: member.communityId,
    status: 'active',
    $or: [
      { targetSegment: 'All' },
      { targetSegment: member.segment },
      { targetMembers: member._id },
    ],
  }).sort('-createdAt')

  const completions = await ActivityCompletion.find({ memberId: member._id })
  const statusByActivity = {}
  for (const c of completions) {
    // Latest non-rejected wins.
    if (c.status !== 'rejected') statusByActivity[c.activityId] = c.status
  }

  const feed = activities.map((a) => ({
    ...a.toObject(),
    memberStatus: statusByActivity[a._id] === 'completed' ? 'done'
      : statusByActivity[a._id] === 'pending' ? 'pending' : 'todo',
  }))
  res.json({ success: true, count: feed.length, activities: feed })
})
