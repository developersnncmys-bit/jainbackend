import mongoose from 'mongoose'
import { COMPLETION_MODES } from './ActivityTemplate.js'

// A community-assigned activity (SOW §7.2.4).
const activitySchema = new mongoose.Schema(
  {
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'ActivityTemplate' },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    points: { type: Number, required: true, min: 0 },
    completionMode: { type: String, enum: COMPLETION_MODES, required: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentItem' },
    dueDate: { type: Date },
    recurrence: { type: String, enum: ['none', 'daily', 'weekly'], default: 'none' },
    targetSegment: { type: String, default: 'All' },
    targetMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
  },
  { timestamps: true }
)

export const Activity = mongoose.model('Activity', activitySchema)
