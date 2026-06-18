import mongoose from 'mongoose'

const giftSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    imageUrl: { type: String },
    category: { type: String, default: 'General' },
    segmentTags: { type: [String], default: ['All'] },
    pointsCost: { type: Number, required: true, min: 0 },
    costPaise: { type: Number, required: true, min: 0 }, // rupee cost to the wallet
    stockQty: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['active', 'out_of_stock', 'inactive'], default: 'active' },
  },
  { timestamps: true }
)

// Keep status in sync with stock.
giftSchema.pre('save', function (next) {
  if (this.status !== 'inactive') {
    this.status = this.stockQty <= 0 ? 'out_of_stock' : 'active'
  }
  next()
})

export const Gift = mongoose.model('Gift', giftSchema)
