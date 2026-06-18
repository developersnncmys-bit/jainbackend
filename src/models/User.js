import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

export const ROLES = ['super_admin', 'principal', 'community_admin', 'member']
export const SEGMENTS = ['Child', 'College', 'Working', 'Elder']

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true, index: true },
    passwordHash: { type: String, select: false },
    role: { type: String, enum: ROLES, required: true },
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', index: true },
    segment: { type: String, enum: SEGMENTS },
    address: { type: String },
    dob: { type: Date },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
)

// Hash a plain password set on the virtual `password` field.
userSchema.virtual('password').set(function (plain) {
  this._password = plain
})

userSchema.pre('save', async function (next) {
  if (this._password) {
    this.passwordHash = await bcrypt.hash(this._password, 10)
  }
  next()
})

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash || '')
}

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash
    return ret
  },
})

export const User = mongoose.model('User', userSchema)
