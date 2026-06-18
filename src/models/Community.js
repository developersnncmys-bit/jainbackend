import mongoose from 'mongoose'

const communitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['school', 'tuition', 'temple', 'sangh'], required: true },
    city: { type: String },
    address: { type: String },
    inviteCode: { type: String, unique: true, uppercase: true, index: true },
    principalUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    giftWalletBalancePaise: { type: Number, default: 0, min: 0 },
    // Per-community commercial terms (SOW §7.3.1).
    pricing: {
      pointToRupee: { type: Number, default: 1 },
      subscriptionPaise: { type: Number, default: 0 },
    },
    status: { type: String, enum: ['pending', 'active', 'suspended'], default: 'pending' },
  },
  { timestamps: true }
)

export const Community = mongoose.model('Community', communitySchema)
