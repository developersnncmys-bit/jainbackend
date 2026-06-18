import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.js'
import { submit, approvalQueue, approve, reject } from '../controllers/completionController.js'

const r = Router()
r.use(protect)

const reviewers = authorize('super_admin', 'principal', 'community_admin')

r.post('/', authorize('member'), submit)
r.get('/queue', reviewers, approvalQueue)
r.patch('/:id/approve', reviewers, approve)
r.patch('/:id/reject', reviewers, reject)

export default r
