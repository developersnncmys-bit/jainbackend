import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.js'
import {
  listMembers, addMember, bulkImport, inviteCode,
  setSegment, setMemberStatus, myProfile,
} from '../controllers/memberController.js'

const r = Router()
r.use(protect)

const admins = authorize('super_admin', 'principal', 'community_admin')

r.get('/me', authorize('member'), myProfile)
r.get('/', admins, listMembers)
r.post('/', admins, addMember)
r.post('/bulk', admins, bulkImport)
r.get('/invite-code', admins, inviteCode)
r.patch('/:id/segment', admins, setSegment)
r.patch('/:id/status', admins, setMemberStatus)

export default r
