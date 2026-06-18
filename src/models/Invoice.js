import mongoose from 'mongoose'

const invoiceSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true },
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
    items: [{ label: String, amountPaise: Number }],
    totalPaise: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' },
    dueDate: { type: Date },
  },
  { timestamps: true }
)

export const Invoice = mongoose.model('Invoice', invoiceSchema)
