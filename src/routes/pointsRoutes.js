import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { myLedger, myBalance } from '../controllers/pointsController.js'

const r = Router()
r.use(protect)

r.get('/ledger', myLedger)
r.get('/balance', myBalance)

export default r
