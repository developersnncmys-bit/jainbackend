// Seeds the database with demo data for all three frontends.
// Run: npm run seed   (wipes the collections below, then recreates them)
import mongoose from 'mongoose'
import { connectDB } from '../config/db.js'
import {
  User, Community, ContentItem, ActivityTemplate, Activity,
  Gift, Invoice, WalletTransaction, PointsLedger, Config,
} from '../models/index.js'
import { rupeesToPaise } from '../utils/money.js'

async function run() {
  await connectDB()
  console.log('Clearing collections…')
  await Promise.all([
    User, Community, ContentItem, ActivityTemplate, Activity,
    Gift, Invoice, WalletTransaction, PointsLedger, Config,
  ].map((M) => M.deleteMany({})))

  // --- Config ---
  await Config.create({ key: 'platform' })

  // --- Super Admin ---
  const superAdmin = await User.create({
    name: 'NNC Operations', email: 'superadmin@jainpatashala.com',
    password: 'super123', role: 'super_admin',
  })

  // --- Community + Principal + Admin ---
  const community = await Community.create({
    name: 'Shree Mahavir Jain Sangh', type: 'sangh', city: 'Mumbai',
    inviteCode: 'MAHAVIR24', status: 'active',
    giftWalletBalancePaise: rupeesToPaise(1_245_000),
  })
  const principal = await User.create({
    name: 'Rajesh Shah', email: 'principal@mahavir.com', password: 'principal123',
    role: 'principal', communityId: community._id,
  })
  community.principalUserId = principal._id
  await community.save()
  await User.create({
    name: 'Priya Mehta', email: 'admin@mahavir.com', password: 'admin123',
    role: 'community_admin', communityId: community._id,
  })

  // A second community (pending) so the super admin has something to approve.
  await Community.create({
    name: 'Adinath Patashala', type: 'school', city: 'Ahmedabad',
    inviteCode: 'ADINATH24', status: 'pending', giftWalletBalancePaise: rupeesToPaise(320_000),
  })

  // --- Member ---
  const member = await User.create({
    name: 'Aarav Shah', phone: '9876543210', role: 'member',
    communityId: community._id, segment: 'Child',
    address: '12, Tirth Residency, Walkeshwar, Mumbai 400006',
  })

  // --- Content (global master library) ---
  await ContentItem.insertMany([
    { title: 'The Namokar Mantra — meaning & recitation', type: 'scripture', minutes: 4, segmentTags: ['All'], scope: 'global', body: 'The Namokar Mantra bows to the qualities of the five supreme beings…' },
    { title: 'Story of Bhagwan Mahavir', type: 'story', minutes: 6, segmentTags: ['Child', 'College'], scope: 'global', body: 'Bhagwan Mahavir, the 24th Tirthankara, renounced royal life…' },
    { title: 'Tattvartha Sutra — Chapter 1', type: 'scripture', minutes: 8, segmentTags: ['College', 'Working'], scope: 'global', body: 'Samyak darshana jnana charitrani moksha margah…' },
    { title: 'What is Samayik?', type: 'article', minutes: 3, segmentTags: ['Working', 'Elder'], scope: 'global', body: 'Samayik is a meditative practice of equanimity for 48 minutes…' },
  ])

  // --- Activity templates ---
  const templates = await ActivityTemplate.insertMany([
    { title: 'Recite the Namokar Mantra', defaultPoints: 50, completionMode: 'Self-declared', segmentTags: ['All'] },
    { title: 'Read a Tirthankara story', defaultPoints: 200, completionMode: 'Auto', segmentTags: ['Child'] },
    { title: 'Namaskar to parents', defaultPoints: 100, completionMode: 'Self-declared', segmentTags: ['All'] },
    { title: 'Attend temple Pratikraman', defaultPoints: 500, completionMode: 'Proof-based', segmentTags: ['Working', 'Elder'] },
    { title: 'Finish a scripture chapter', defaultPoints: 1000, completionMode: 'Auto', segmentTags: ['College', 'Working'] },
    { title: 'Help at a community seva drive', defaultPoints: 750, completionMode: 'Proof-based', segmentTags: ['All'] },
  ])

  // --- Activities assigned to the community ---
  await Activity.insertMany([
    { communityId: community._id, templateId: templates[0]._id, title: 'Recite the Namokar Mantra', points: 50, completionMode: 'Self-declared', recurrence: 'daily', targetSegment: 'All' },
    { communityId: community._id, templateId: templates[2]._id, title: 'Namaskar to parents', points: 100, completionMode: 'Self-declared', recurrence: 'daily', targetSegment: 'All' },
    { communityId: community._id, templateId: templates[3]._id, title: 'Attend temple Pratikraman', points: 500, completionMode: 'Proof-based', targetSegment: 'All' },
  ])

  // --- Gifts ---
  await Gift.insertMany([
    { name: 'Brass Diya Set', category: 'Pooja', segmentTags: ['All'], pointsCost: 1200, costPaise: rupeesToPaise(1200), stockQty: 48 },
    { name: 'Jain Story Book Set', category: 'Books', segmentTags: ['Child'], pointsCost: 450, costPaise: rupeesToPaise(450), stockQty: 120 },
    { name: 'Steel Tiffin', category: 'Utility', segmentTags: ['Working'], pointsCost: 600, costPaise: rupeesToPaise(600), stockQty: 9 },
    { name: 'Toy Lorry', category: 'Toys', segmentTags: ['Child'], pointsCost: 300, costPaise: rupeesToPaise(300), stockQty: 0 },
    { name: 'Navkar Mantra Wall Frame', category: 'Decor', segmentTags: ['All'], pointsCost: 800, costPaise: rupeesToPaise(800), stockQty: 33 },
  ])

  // --- Member starting points (ledger) ---
  await PointsLedger.insertMany([
    { memberId: member._id, communityId: community._id, type: 'earn', points: 1000, title: 'Finished a scripture chapter', refType: 'completion' },
    { memberId: member._id, communityId: community._id, type: 'earn', points: 750, title: 'Helped at a community seva drive', refType: 'completion' },
    { memberId: member._id, communityId: community._id, type: 'earn', points: 500, title: 'Attended temple Pratikraman', refType: 'completion' },
  ])

  // --- Wallet top-up + invoice ---
  await WalletTransaction.create({
    communityId: community._id, type: 'topup', amountPaise: rupeesToPaise(1_245_000),
    balanceAfterPaise: community.giftWalletBalancePaise, title: 'Initial Gift Wallet top-up',
    refType: 'razorpay', status: 'success',
  })
  await Invoice.create({
    code: 'INV-2026-014', communityId: community._id,
    items: [{ label: 'Gift Wallet top-up', amountPaise: rupeesToPaise(500_000) }],
    totalPaise: rupeesToPaise(500_000), status: 'paid',
  })

  console.log('\n✓ Seed complete. Demo credentials:')
  console.log('  Super Admin   → superadmin@jainpatashala.com / super123')
  console.log('  Principal     → principal@mahavir.com / principal123')
  console.log('  Community Admin→ admin@mahavir.com / admin123')
  console.log('  Member        → phone 9876543210, OTP 1234, invite code MAHAVIR24')
  await mongoose.disconnect()
  process.exit(0)
}

run().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
