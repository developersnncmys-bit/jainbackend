import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { Activity } from '../models/Activity.js'
import { ActivityCompletion } from '../models/ActivityCompletion.js'
import { submitCompletion, approveCompletion, rejectCompletion } from '../services/completionService.js'

// POST /api/completions  { activityId, note?, proofUrl? }  (member)
export const submit = asyncHandler(async (req, res) => {
  const { activityId, note, proofUrl } = req.body
  const activity = await Activity.findById(activityId)
  if (!activity) throw ApiError.notFound('Activity not found')
  if (String(activity.communityId) !== String(req.user.communityId)) {
    throw ApiError.forbidden('Activity is not in your community')
  }
  const completion = await submitCompletion({ member: req.user, activity, note, proofUrl })
  res.status(201).json({ success: true, completion })
})

// GET /api/completions/queue — proof-based pending approvals (community admin)
export const approvalQueue = asyncHandler(async (req, res) => {
  const communityId = req.user.role === 'super_admin' ? req.query.communityId : req.user.communityId
  const queue = await ActivityCompletion.find({ communityId, status: 'pending' })
    .populate('memberId', 'name segment')
    .populate('activityId', 'title points')
    .sort('createdAt')
  res.json({ success: true, count: queue.length, queue })
})

// PATCH /api/completions/:id/approve
export const approve = asyncHandler(async (req, res) => {
  const completion = await ActivityCompletion.findById(req.params.id)
  if (!completion) throw ApiError.notFound('Completion not found')
  if (req.user.role !== 'super_admin' && String(completion.communityId) !== String(req.user.communityId)) {
    throw ApiError.forbidden('Cross-community access denied')
  }
  const updated = await approveCompletion({ reviewer: req.user, completion })
  res.json({ success: true, completion: updated })
})

// PATCH /api/completions/:id/reject  { reason }
export const reject = asyncHandler(async (req, res) => {
  const completion = await ActivityCompletion.findById(req.params.id)
  if (!completion) throw ApiError.notFound('Completion not found')
  if (req.user.role !== 'super_admin' && String(completion.communityId) !== String(req.user.communityId)) {
    throw ApiError.forbidden('Cross-community access denied')
  }
  const updated = await rejectCompletion({ reviewer: req.user, completion, reason: req.body.reason })
  res.json({ success: true, completion: updated })
})
