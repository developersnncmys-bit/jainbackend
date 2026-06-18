import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { Invoice } from '../models/Invoice.js'
import { rupeesToPaise } from '../utils/money.js'

const code = () => `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 899)}`

// GET /api/invoices — super admin: all; community: own
export const listInvoices = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'super_admin'
    ? (req.query.communityId ? { communityId: req.query.communityId } : {})
    : { communityId: req.user.communityId }
  const invoices = await Invoice.find(filter).sort('-createdAt').populate('communityId', 'name')
  res.json({ success: true, count: invoices.length, invoices })
})

// POST /api/invoices  (super admin)  { communityId, items?, totalRupees, dueDate }
export const createInvoice = asyncHandler(async (req, res) => {
  const { communityId, items, totalRupees, totalPaise, dueDate } = req.body
  if (!communityId) throw ApiError.badRequest('communityId is required')
  const invoice = await Invoice.create({
    code: code(), communityId,
    items: items || [], totalPaise: totalPaise ?? rupeesToPaise(totalRupees),
    status: 'pending', dueDate,
  })
  res.status(201).json({ success: true, invoice })
})

// PATCH /api/invoices/:id/status  { status }
export const setInvoiceStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  if (!['pending', 'paid', 'overdue'].includes(status)) throw ApiError.badRequest('Invalid status')
  const invoice = await Invoice.findByIdAndUpdate(req.params.id, { status }, { new: true })
  if (!invoice) throw ApiError.notFound('Invoice not found')
  res.json({ success: true, invoice })
})
