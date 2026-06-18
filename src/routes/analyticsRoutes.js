import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.js'
import { platformAnalytics, communityReport } from '../controllers/analyticsController.js'

const r = Router()
r.use(protect)

r.get('/platform', authorize('super_admin'), platformAnalytics)
r.get('/community', authorize('super_admin', 'principal', 'community_admin'), communityReport)

export default r
