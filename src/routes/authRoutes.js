import { Router } from 'express'
import { body } from 'express-validator'
import { validate } from '../middleware/validate.js'
import { protect } from '../middleware/auth.js'
import {
  adminLogin, requestOtp, verifyOtp, registerMember, me,
} from '../controllers/authController.js'

const r = Router()

r.post('/admin/login',
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  validate, adminLogin)

r.post('/member/request-otp',
  body('phone').notEmpty().withMessage('Phone required'),
  validate, requestOtp)

r.post('/member/verify-otp',
  body('phone').notEmpty(), body('otp').notEmpty(),
  validate, verifyOtp)

r.post('/member/register',
  body('phone').notEmpty(), body('otp').notEmpty(),
  body('name').notEmpty().withMessage('Name required'),
  body('inviteCode').notEmpty().withMessage('Invite code required'),
  validate, registerMember)

r.get('/me', protect, me)

export default r
