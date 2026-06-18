import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.js'
import { listOrders, getOrder, redeem, bulk, advance } from '../controllers/orderController.js'

const r = Router()
r.use(protect)

r.get('/', listOrders)
r.post('/redeem', authorize('member'), redeem)
r.post('/bulk', authorize('super_admin', 'principal', 'community_admin'), bulk)
r.get('/:id', getOrder)
r.patch('/:id/advance', authorize('super_admin'), advance)

export default r
