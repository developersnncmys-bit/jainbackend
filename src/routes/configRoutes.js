import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.js'
import { getConfig, updateConfig } from '../controllers/configController.js'

const r = Router()
r.use(protect)

r.get('/', getConfig)
r.patch('/', authorize('super_admin'), updateConfig)

export default r
