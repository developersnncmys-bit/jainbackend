import mongoose from 'mongoose'

// Gift Wallet movements per community (SOW §10).
const walletTransactionSchema = new mongoose.Schema(
  {
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
    type: { type: String, enum: ['topup', 'debit'], required: true },
    amountPaise: { type: Number, required: true },
    balanceAfterPaise: { type: Number },
    title: { type: String },
    refType: { type: String, enum: ['order', 'razorpay', 'manual'] },
    refId: { type: mongoose.Schema.Types.ObjectId },
    gateway: { type: String, default: 'razorpay' },
    status: { type: String, enum: ['success', 'pending', 'failed'], default: 'success' },
  },
  { timestamps: true }
)

export const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema)
