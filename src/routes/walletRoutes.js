import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.js'
import { listTransactions, walletBalance } from '../controllers/walletController.js'

const r = Router()
r.use(protect)

const admins = authorize('super_admin', 'principal', 'community_admin')

r.get('/transactions', admins, listTransactions)
r.get('/balance', admins, walletBalance)

export default r
