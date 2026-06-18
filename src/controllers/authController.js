import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { signToken } from '../utils/jwt.js'
import { User } from '../models/User.js'
import { Community } from '../models/Community.js'
import { env } from '../config/env.js'

// --- Simple in-memory OTP store (replace with SMS/DLT provider in prod) ---
const otpStore = new Map() // phone -> { otp, expires }
const DEMO_OTP = '1234'

const issue = (user) => signToken({ sub: user._id, role: user.role })

// POST /api/auth/admin/login  (super_admin, principal, community_admin)
export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+passwordHash')
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password')
  }
  if (user.role === 'member') throw ApiError.forbidden('Use the member app to sign in')
  res.json({ success: true, token: issue(user), user })
})

// POST /api/auth/member/request-otp  { phone }
export const requestOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body
  if (!/^\d{10}$/.test(String(phone || ''))) throw ApiError.badRequest('Enter a valid 10-digit phone')
  const otp = env.nodeEnv === 'production' ? String(Math.floor(1000 + Math.random() * 9000)) : DEMO_OTP
  otpStore.set(phone, { otp, expires: Date.now() + 5 * 60 * 1000 })
  // In production this is sent over SMS; in dev we return it for convenience.
  res.json({ success: true, message: 'OTP sent', ...(env.nodeEnv !== 'production' ? { devOtp: otp } : {}) })
})

const checkOtp = (phone, otp) => {
  const rec = otpStore.get(phone)
  if (!rec || rec.expires < Date.now()) throw ApiError.badRequest('OTP expired — request again')
  if (rec.otp !== String(otp)) throw ApiError.badRequest('Incorrect OTP')
}

// POST /api/auth/member/verify-otp  { phone, otp }
// Existing member → token. New phone → needsProfile so the client collects details.
export const verifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body
  checkOtp(phone, otp)
  const user = await User.findOne({ phone, role: 'member' })
  if (!user) return res.json({ success: true, needsProfile: true })
  otpStore.delete(phone)
  res.json({ success: true, token: issue(user), user })
})

// POST /api/auth/member/register  { phone, otp, name, inviteCode, segment, address }
export const registerMember = asyncHandler(async (req, res) => {
  const { phone, otp, name, inviteCode, segment, address } = req.body
  checkOtp(phone, otp)

  const community = await Community.findOne({ inviteCode: String(inviteCode || '').toUpperCase() })
  if (!community) throw ApiError.badRequest('Invalid community invite code')
  if (community.status !== 'active') throw ApiError.badRequest('This community is not active yet')

  const exists = await User.findOne({ phone, role: 'member' })
  if (exists) throw ApiError.conflict('A member already exists for this phone')

  const user = await User.create({
    name, phone, role: 'member', communityId: community._id,
    segment: segment || 'Child', address, status: 'active',
  })
  otpStore.delete(phone)
  res.status(201).json({ success: true, token: issue(user), user })
})

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user })
})
