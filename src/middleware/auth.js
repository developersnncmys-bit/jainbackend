import { verifyToken } from '../utils/jwt.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../models/User.js'

// Verifies the JWT and attaches req.user.
export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) throw ApiError.unauthorized('Missing auth token')

  let payload
  try {
    payload = verifyToken(token)
  } catch {
    throw ApiError.unauthorized('Invalid or expired token')
  }

  const user = await User.findById(payload.sub)
  if (!user || user.status !== 'active') throw ApiError.unauthorized('Account not found or inactive')
  req.user = user
  next()
})

// Restricts a route to one or more roles (server-side RBAC, SOW §14).
export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized())
  if (!roles.includes(req.user.role)) return next(ApiError.forbidden('Insufficient role'))
  next()
}

// Multi-tenant guard: non-super-admins may only touch their own community's data.
// Reads the community id from params/body/query and compares to the user's.
export const sameCommunity = (getId = (req) => req.params.communityId) => (req, _res, next) => {
  if (req.user.role === 'super_admin') return next()
  const target = String(getId(req) || '')
  if (target && target !== String(req.user.communityId || '')) {
    return next(ApiError.forbidden('Cross-community access denied'))
  }
  next()
}
