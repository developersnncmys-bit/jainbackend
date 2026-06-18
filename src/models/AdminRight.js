import mongoose from 'mongoose'

// Principal grants/revokes community-admin rights (SOW §7.2.2).
const adminRightSchema = new mongoose.Schema(
  {
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    scope: { type: [String], default: ['members', 'activities', 'approvals', 'orders'] },
    status: { type: String, enum: ['active', 'revoked'], default: 'active' },
  },
  { timestamps: true }
)

export const AdminRight = mongoose.model('AdminRight', adminRightSchema)
