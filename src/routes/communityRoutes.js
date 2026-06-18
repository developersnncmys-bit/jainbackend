import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.js'
import {
  listCommunities, getCommunity, onboardCommunity,
  setCommunityStatus, setPricing, topUpWallet,
} from '../controllers/communityController.js'

const r = Router()
r.use(protect)

r.get('/', listCommunities)
r.post('/', authorize('super_admin'), onboardCommunity)
r.get('/:id', getCommunity)
r.patch('/:id/status', authorize('super_admin'), setCommunityStatus)
r.patch('/:id/pricing', authorize('super_admin'), setPricing)
r.post('/:id/topup', authorize('super_admin', 'principal'), topUpWallet)

export default r
