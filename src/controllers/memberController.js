import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/User.js'
import { Community } from '../models/Community.js'
import { getBalance } from '../services/pointsService.js'

// Resolve which community the actor is operating on.
const communityOf = (req) =>
  req.user.role === 'super_admin' ? (req.query.communityId || req.body.communityId) : req.user.communityId

// GET /api/members
export const listMembers = asyncHandler(async (req, res) => {
  const communityId = communityOf(req)
  if (!communityId) throw ApiError.badRequest('communityId is required')
  const members = await User.find({ communityId, role: 'member' }).sort('-createdAt')
  res.json({ success: true, count: members.length, members })
})

// POST /api/members
export const addMember = asyncHandler(async (req, res) => {
  const communityId = communityOf(req)
  const { name, phone, segment, address } = req.body
  if (!name) throw ApiError.badRequest('Name is required')
  const member = await User.create({ name, phone, segment: segment || 'Child', address, role: 'member', communityId })
  res.status(201).json({ success: true, member })
})

// POST /api/members/bulk  { members: [{name, phone, segment}] }
export const bulkImport = asyncHandler(async (req, res) => {
  const communityId = communityOf(req)
  const rows = Array.isArray(req.body.members) ? req.body.members : []
  if (!rows.length) throw ApiError.badRequest('No members provided')
  const docs = rows
    .filter((r) => r.name)
    .map((r) => ({ name: r.name, phone: r.phone, segment: r.segment || 'Child', role: 'member', communityId }))
  const created = await User.insertMany(docs)
  res.status(201).json({ success: true, imported: created.length, members: created })
})

// GET /api/members/invite-code — the code members use to join
export const inviteCode = asyncHandler(async (req, res) => {
  const communityId = communityOf(req)
  const community = await Community.findById(communityId)
  if (!community) throw ApiError.notFound('Community not found')
  res.json({ success: true, inviteCode: community.inviteCode })
})

// PATCH /api/members/:id/segment
export const setSegment = asyncHandler(async (req, res) => {
  const member = await User.findById(req.params.id)
  if (!member || member.role !== 'member') throw ApiError.notFound('Member not found')
  if (req.user.role !== 'super_admin' && String(member.communityId) !== String(req.user.communityId)) {
    throw ApiError.forbidden('Cross-community access denied')
  }
  member.segment = req.body.segment
  await member.save()
  res.json({ success: true, member })
})

// PATCH /api/members/:id/status  { status: active|inactive }
export const setMemberStatus = asyncHandler(async (req, res) => {
  const member = await User.findById(req.params.id)
  if (!member || member.role !== 'member') throw ApiError.notFound('Member not found')
  if (req.user.role !== 'super_admin' && String(member.communityId) !== String(req.user.communityId)) {
    throw ApiError.forbidden('Cross-community access denied')
  }
  member.status = req.body.status === 'inactive' ? 'inactive' : 'active'
  await member.save()
  res.json({ success: true, member })
})

// GET /api/members/me — member's own profile + live balance
export const myProfile = asyncHandler(async (req, res) => {
  const balance = await getBalance(req.user._id)
  res.json({ success: true, member: req.user, balance })
})
