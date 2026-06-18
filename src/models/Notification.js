import mongoose from 'mongoose'

// In-app notifications (SOW §13). FCM push is layered on top in production.
const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', index: true },
    // Broadcast to a role instead of a single user (e.g. all super admins).
    role: { type: String },
    event: { type: String },
    text: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export const Notification = mongoose.model('Notification', notificationSchema)
