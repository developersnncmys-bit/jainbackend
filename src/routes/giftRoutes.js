import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.js'
import {
  listGifts, createGift, updateGift, restockGift, deactivateGift, lowStock,
} from '../controllers/giftController.js'

const r = Router()
r.use(protect)

r.get('/', listGifts)
r.get('/low-stock', authorize('super_admin'), lowStock)
r.post('/', authorize('super_admin'), createGift)
r.patch('/:id', authorize('super_admin'), updateGift)
r.post('/:id/restock', authorize('super_admin'), restockGift)
r.delete('/:id', authorize('super_admin'), deactivateGift)

export default r
