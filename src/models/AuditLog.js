import mongoose from 'mongoose'

// Audit trail for admin actions (SOW §14): rights granted, approvals, orders.
const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorRole: { type: String },
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', index: true },
    action: { type: String, required: true },
    target: { type: String },
    meta: { type: Object },
  },
  { timestamps: true }
)

export const AuditLog = mongoose.model('AuditLog', auditLogSchema)
