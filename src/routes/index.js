import { Router } from 'express'
import authRoutes from './authRoutes.js'
import communityRoutes from './communityRoutes.js'
import memberRoutes from './memberRoutes.js'
import accessRoutes from './accessRoutes.js'
import contentRoutes from './contentRoutes.js'
import templateRoutes from './templateRoutes.js'
import activityRoutes from './activityRoutes.js'
import completionRoutes from './completionRoutes.js'
import pointsRoutes from './pointsRoutes.js'
import giftRoutes from './giftRoutes.js'
import orderRoutes from './orderRoutes.js'
import walletRoutes from './walletRoutes.js'
import invoiceRoutes from './invoiceRoutes.js'
import analyticsRoutes from './analyticsRoutes.js'
import configRoutes from './configRoutes.js'
import notificationRoutes from './notificationRoutes.js'

const router = Router()

router.get('/', (_req, res) =>
  res.json({ success: true, name: 'Jain Patashala API', version: '1.0.0' })
)

router.use('/auth', authRoutes)
router.use('/communities', communityRoutes)
router.use('/members', memberRoutes)
router.use('/access', accessRoutes)
router.use('/content', contentRoutes)
router.use('/templates', templateRoutes)
router.use('/activities', activityRoutes)
router.use('/completions', completionRoutes)
router.use('/points', pointsRoutes)
router.use('/gifts', giftRoutes)
router.use('/orders', orderRoutes)
router.use('/wallet', walletRoutes)
router.use('/invoices', invoiceRoutes)
router.use('/analytics', analyticsRoutes)
router.use('/config', configRoutes)
router.use('/notifications', notificationRoutes)

export default router
