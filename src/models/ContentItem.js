import mongoose from 'mongoose'

const contentItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ['scripture', 'story', 'article'], required: true },
    body: { type: String },
    mediaUrl: { type: String },
    minutes: { type: Number, default: 5 },
    segmentTags: { type: [String], default: ['All'] },
    // global = master library (super admin); community = community-uploaded.
    scope: { type: String, enum: ['global', 'community'], default: 'global' },
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

export const ContentItem = mongoose.model('ContentItem', contentItemSchema)
