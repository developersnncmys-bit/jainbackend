import mongoose from 'mongoose'

export const COMPLETION_MODES = ['Auto', 'Self-declared', 'Proof-based']

// Master reusable activities communities can adopt (SOW §7.3.3).
const activityTemplateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    defaultPoints: { type: Number, required: true, min: 0 },
    completionMode: { type: String, enum: COMPLETION_MODES, required: true },
    segmentTags: { type: [String], default: ['All'] },
  },
  { timestamps: true }
)

export const ActivityTemplate = mongoose.model('ActivityTemplate', activityTemplateSchema)
