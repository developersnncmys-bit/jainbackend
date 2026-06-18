import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { listNotifications, markAllRead, markRead } from '../controllers/notificationController.js'

const r = Router()
r.use(protect)

r.get('/', listNotifications)
r.patch('/read-all', markAllRead)
r.patch('/:id/read', markRead)

export default r
