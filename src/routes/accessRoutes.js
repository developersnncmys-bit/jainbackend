import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.js'
import { listAdmins, grantAdmin, revokeAdmin, auditTrail } from '../controllers/accessController.js'

const r = Router()
r.use(protect)

// Principal manages admin rights for their community; super admin can too.
const principal = authorize('super_admin', 'principal')

r.get('/', principal, listAdmins)
r.post('/grant', principal, grantAdmin)
r.patch('/:userId/revoke', principal, revokeAdmin)
r.get('/audit', authorize('super_admin', 'principal', 'community_admin'), auditTrail)

export default r
