import { Notification } from '../models/Notification.js'
import { opt } from '../utils/withTransaction.js'

// Thin helpers so controllers/services can fire notifications consistently.
// In production these also enqueue FCM push / SMS (SOW §12, §13).
export async function notifyUser(userId, event, text, session) {
  if (!userId) return
  await Notification.create([{ userId, event, text }], opt(session))
}

export async function notifyRole(role, event, text, session, communityId) {
  await Notification.create([{ role, communityId, event, text }], opt(session))
}
