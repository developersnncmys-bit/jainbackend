import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.js'
import { listInvoices, createInvoice, setInvoiceStatus } from '../controllers/invoiceController.js'

const r = Router()
r.use(protect)

r.get('/', authorize('super_admin', 'principal', 'community_admin'), listInvoices)
r.post('/', authorize('super_admin'), createInvoice)
r.patch('/:id/status', authorize('super_admin'), setInvoiceStatus)

export default r
