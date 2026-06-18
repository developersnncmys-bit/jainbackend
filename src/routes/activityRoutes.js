import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.js'
import {
  listActivities, createActivity, updateActivity, archiveActivity, memberFeed,
} from '../controllers/activityController.js'

const r = Router()
r.use(protect)

const admins = authorize('super_admin', 'principal', 'community_admin')

r.get('/feed', authorize('member'), memberFeed)
r.get('/', admins, listActivities)
r.post('/', admins, createActivity)
r.patch('/:id', admins, updateActivity)
r.delete('/:id', admins, archiveActivity)

export default r
