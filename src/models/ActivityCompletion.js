import mongoose from 'mongoose'
import { COMPLETION_MODES } from './ActivityTemplate.js'

// One member's attempt at an activity — the verification state machine (SOW §8).
// State flow: in_progress → (pending) → completed / rejected.
const activityCompletionSchema = new mongoose.Schema(
  {
    activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true, index: true },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', index: true },
    mode: { type: String, enum: COMPLETION_MODES, required: true },
    points: { type: Number, required: true },
    proofUrl: { type: String },
    note: { type: String },
    status: { type: String, enum: ['pending', 'completed', 'rejected'], required: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectReason: { type: String },
    completedAt: { type: Date },
    // Anti-abuse window key (e.g. activityId + YYYY-MM-DD for daily habits).
    claimKey: { type: String },
  },
  { timestamps: true }
)

// A member can't claim the same activity twice in its valid window.
activityCompletionSchema.index({ claimKey: 1 }, { unique: true, sparse: true })

export const ActivityCompletion = mongoose.model('ActivityCompletion', activityCompletionSchema)
