import mongoose from 'mongoose'

export const ORDER_PIPELINE = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered']

const orderItemSchema = new mongoose.Schema(
  {
    giftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gift' },
    name: String,
    qty: { type: Number, default: 1, min: 1 },
    pointsCost: Number,
    costPaise: Number,
  },
  { _id: false }
)

// Two origins (redemption / bulk), one fulfillment pipeline (SOW §9).
const orderSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true },
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null for bulk
    type: { type: String, enum: ['redemption', 'bulk'], required: true },
    items: [orderItemSchema],
    deliveryTarget: { type: String, enum: ['home', 'community'], default: 'home' },
    address: { type: String },
    totalPaise: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    status: { type: String, enum: ORDER_PIPELINE, default: 'Placed', index: true },
    courier: { type: String },
    trackingId: { type: String },
    backordered: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export const Order = mongoose.model('Order', orderSchema)
