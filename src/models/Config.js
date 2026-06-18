import mongoose from 'mongoose'

// Singleton platform configuration (SOW §7.3.7).
const configSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'platform', unique: true },
    pointToRupee: { type: Number, default: 1 },
    lowStockThreshold: { type: Number, default: 10 },
    segments: { type: [String], default: ['Child', 'College', 'Working', 'Elder'] },
    notificationTemplates: {
      type: Object,
      default: {
        'New activity assigned': true,
        'Completion approved / rejected': true,
        'Points credited': true,
        'Order status changed': true,
        'Gift Wallet low balance': true,
        'Low stock': true,
      },
    },
  },
  { timestamps: true }
)

configSchema.statics.getSingleton = async function () {
  let cfg = await this.findOne({ key: 'platform' })
  if (!cfg) cfg = await this.create({ key: 'platform' })
  return cfg
}

export const Config = mongoose.model('Config', configSchema)
