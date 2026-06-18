import { ActivityCompletion } from '../models/ActivityCompletion.js'
import { ApiError } from '../utils/ApiError.js'
import { withTransaction } from '../utils/withTransaction.js'
import { addLedgerEntry } from './pointsService.js'
import { notifyRole, notifyUser } from './notificationService.js'

// Window key for anti-abuse: daily habits reset per day, others per activity.
function buildClaimKey(activity, memberId) {
  if (activity.recurrence === 'daily') {
    const day = new Date().toISOString().slice(0, 10)
    return `${activity._id}:${memberId}:${day}`
  }
  return `${activity._id}:${memberId}`
}

async function creditCompletion(completion, session) {
  completion.status = 'completed'
  completion.completedAt = new Date()
  await completion.save({ session: session || undefined })
  await addLedgerEntry(
    { memberId: completion.memberId, communityId: completion.communityId, type: 'earn', points: completion.points, title: completion._activityTitle || 'Activity completed', refType: 'completion', refId: completion._id },
    session
  )
  await notifyUser(completion.memberId, 'Points credited', `+${completion.points} points credited`, session)
}

// Member submits an activity. Auto/Self-declared complete immediately and credit
// points; Proof-based goes to Pending Approval (points credit only on approval).
export async function submitCompletion({ member, activity, note, proofUrl }) {
  const claimKey = buildClaimKey(activity, member._id)
  const existing = await ActivityCompletion.findOne({ claimKey })
  if (existing && existing.status !== 'rejected') {
    throw ApiError.conflict('This activity has already been claimed in its current window')
  }

  return withTransaction(async (session) => {
    const isProof = activity.completionMode === 'Proof-based'
    const [completion] = await ActivityCompletion.create(
      [{
        activityId: activity._id, memberId: member._id, communityId: activity.communityId,
        mode: activity.completionMode, points: activity.points,
        note, proofUrl, status: isProof ? 'pending' : 'completed', claimKey,
      }],
      session ? { session } : {}
    )
    completion._activityTitle = activity.title

    if (isProof) {
      await notifyRole('community_admin', 'Completion pending approval',
        `${member.name} submitted “${activity.title}” for approval`, session, activity.communityId)
    } else {
      // Re-credit through the shared helper (already saved; just add ledger entry).
      await addLedgerEntry(
        { memberId: member._id, communityId: activity.communityId, type: 'earn', points: activity.points, title: activity.title, refType: 'completion', refId: completion._id },
        session
      )
      completion.completedAt = new Date()
      await completion.save(session ? { session } : {})
      await notifyUser(member._id, 'Points credited', `+${activity.points} points for “${activity.title}”`, session)
    }
    return completion
  })
}

export async function approveCompletion({ reviewer, completion }) {
  if (completion.status !== 'pending') throw ApiError.badRequest('Completion is not pending')
  return withTransaction(async (session) => {
    completion.reviewedBy = reviewer._id
    await creditCompletion(completion, session)
    return completion
  })
}

export async function rejectCompletion({ reviewer, completion, reason }) {
  if (completion.status !== 'pending') throw ApiError.badRequest('Completion is not pending')
  completion.status = 'rejected'
  completion.reviewedBy = reviewer._id
  completion.rejectReason = reason
  await completion.save()
  await notifyUser(completion.memberId, 'Completion approved / rejected',
    `Your submission was rejected${reason ? `: ${reason}` : ''}`)
  return completion
}
