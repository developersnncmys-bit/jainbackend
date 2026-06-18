import mongoose from 'mongoose'

// Append-only points ledger (SOW §6). Balance = sum of points for a member.
// Never updated or deleted — every earn/redeem is an immutable transaction.
const pointsLedgerSchema = new mongoose.Schema(
  {
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', index: true },
    type: { type: String, enum: ['earn', 'redeem'], required: true },
    points: { type: Number, required: true }, // earn = +, redeem = -
    title: { type: String },
    refType: { type: String, enum: ['completion', 'order', 'adjustment'] },
    refId: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

export const PointsLedger = mongoose.model('PointsLedger', pointsLedgerSchema)
