import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/User.js'
import { AdminRight } from '../models/AdminRight.js'
import { AuditLog } from '../models/AuditLog.js'

const communityOf = (req) =>
  req.user.role === 'super_admin' ? (req.body.communityId || req.query.communityId) : req.user.communityId

// GET /api/access — list community admins
export const listAdmins = asyncHandler(async (req, res) => {
  const communityId = communityOf(req)
  const admins = await User.find({ communityId, role: 'community_admin' }).sort('-createdAt')
  res.json({ success: true, count: admins.length, admins })
})

// POST /api/access/grant  { name, email, password, scope? }  (principal)
export const grantAdmin = asyncHandler(async (req, res) => {
  const communityId = communityOf(req)
  const { name, email, password, scope } = req.body
  if (!email || !password) throw ApiError.badRequest('Email and password are required')

  const admin = await User.create({ name: name || email, email, password, role: 'community_admin', communityId })
  const right = await AdminRight.create({ communityId, userId: admin._id, grantedBy: req.user._id, scope })
  await AuditLog.create({ actorId: req.user._id, actorRole: req.user.role, communityId, action: 'admin.grant', target: admin.email })
  res.status(201).json({ success: true, admin, right })
})

// PATCH /api/access/:userId/revoke  (principal)
export const revokeAdmin = asyncHandler(async (req, res) => {
  const communityId = communityOf(req)
  const admin = await User.findById(req.params.userId)
  if (!admin || String(admin.communityId) !== String(communityId)) throw ApiError.notFound('Admin not found')

  await AdminRight.updateMany({ userId: admin._id, communityId }, { status: 'revoked' })
  admin.role = 'member'
  admin.status = 'inactive'
  await admin.save()
  await AuditLog.create({ actorId: req.user._id, actorRole: req.user.role, communityId, action: 'admin.revoke', target: admin.email })
  res.json({ success: true, message: 'Admin rights revoked' })
})

// GET /api/access/audit — admin action audit log
export const auditTrail = asyncHandler(async (req, res) => {
  const communityId = communityOf(req)
  const filter = req.user.role === 'super_admin' && !communityId ? {} : { communityId }
  const logs = await AuditLog.find(filter).sort('-createdAt').limit(200).populate('actorId', 'name role')
  res.json({ success: true, count: logs.length, logs })
})
