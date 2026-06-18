import { Community } from '../models/Community.js'
import { Gift } from '../models/Gift.js'
import { Order, ORDER_PIPELINE } from '../models/Order.js'
import { WalletTransaction } from '../models/WalletTransaction.js'
import { ApiError } from '../utils/ApiError.js'
import { withTransaction, opt } from '../utils/withTransaction.js'
import { getBalance, addLedgerEntry } from './pointsService.js'
import { notifyRole, notifyUser } from './notificationService.js'

const code = (p) => `${p}-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`

// Debit the community Gift Wallet and record the transaction.
async function debitWallet(community, amountPaise, title, refId, session) {
  community.giftWalletBalancePaise -= amountPaise
  await community.save(opt(session))
  await WalletTransaction.create(
    [{
      communityId: community._id, type: 'debit', amountPaise,
      balanceAfterPaise: community.giftWalletBalancePaise,
      title, refType: 'order', refId, status: 'success',
    }],
    opt(session)
  )
}

// MEMBER REDEMPTION (SOW §6, §9): debits member points + community Gift Wallet,
// decrements stock, raises an order — all atomically.
export async function redeemGift({ member, giftId, deliveryTarget, address }) {
  return withTransaction(async (session) => {
    const gift = await Gift.findById(giftId).session(session || null)
    if (!gift) throw ApiError.notFound('Gift not found')

    const community = await Community.findById(member.communityId).session(session || null)
    if (!community) throw ApiError.badRequest('Member has no community')

    // Guard 1 — stock (allow backorder flag, notify super admin).
    if (gift.stockQty <= 0) throw ApiError.badRequest('Gift is out of stock')

    // Guard 2 — member balance.
    const balance = await getBalance(member._id)
    if (balance < gift.pointsCost) throw ApiError.badRequest('Insufficient points balance')

    // Guard 3 — community Gift Wallet must cover the rupee cost.
    if (community.giftWalletBalancePaise < gift.costPaise) {
      await notifyRole('community_admin', 'Gift Wallet low balance',
        `Gift Wallet too low to fulfil a redemption (${gift.name}). Please top up.`,
        session, community._id)
      throw ApiError.badRequest('Community Gift Wallet has insufficient balance')
    }

    const [order] = await Order.create(
      [{
        code: code('ORD'),
        communityId: community._id,
        memberId: member._id,
        type: 'redemption',
        items: [{ giftId: gift._id, name: gift.name, qty: 1, pointsCost: gift.pointsCost, costPaise: gift.costPaise }],
        deliveryTarget,
        address,
        totalPaise: gift.costPaise,
        totalPoints: gift.pointsCost,
        status: 'Placed',
      }],
      opt(session)
    )

    // Debit member points (append-only ledger).
    await addLedgerEntry(
      { memberId: member._id, communityId: community._id, type: 'redeem', points: -gift.pointsCost, title: `Redeemed: ${gift.name}`, refType: 'order', refId: order._id },
      session
    )
    // Debit community wallet.
    await debitWallet(community, gift.costPaise, `Redemption: ${gift.name}`, order._id, session)
    // Decrement stock.
    gift.stockQty -= 1
    await gift.save(opt(session))

    await notifyRole('super_admin', 'Order status changed', `New redemption order ${order.code} (${gift.name})`, session)
    return order
  })
}

// BULK GIFT ORDER (SOW §9): debits the Gift Wallet only.
export async function createBulkOrder({ community, items, deliveryTarget, address }) {
  return withTransaction(async (session) => {
    let totalPaise = 0
    const orderItems = []
    for (const it of items) {
      const gift = await Gift.findById(it.giftId).session(session || null)
      if (!gift) throw ApiError.notFound(`Gift not found: ${it.giftId}`)
      const qty = Math.max(1, Number(it.qty || 1))
      totalPaise += gift.costPaise * qty
      orderItems.push({ giftId: gift._id, name: gift.name, qty, pointsCost: gift.pointsCost, costPaise: gift.costPaise })
    }

    if (community.giftWalletBalancePaise < totalPaise) {
      throw ApiError.badRequest('Community Gift Wallet has insufficient balance')
    }

    const [order] = await Order.create(
      [{
        code: code('ORD'), communityId: community._id, type: 'bulk',
        items: orderItems, deliveryTarget, address, totalPaise, status: 'Placed',
      }],
      opt(session)
    )
    await debitWallet(community, totalPaise, `Bulk order ${order.code}`, order._id, session)
    await notifyRole('super_admin', 'Order status changed', `New bulk order ${order.code}`, session)
    return order
  })
}

// Advance an order one step through the pipeline (SOW §7.3.5).
export async function advanceOrder(order, { courier, trackingId } = {}) {
  const i = ORDER_PIPELINE.indexOf(order.status)
  if (i === -1 || i === ORDER_PIPELINE.length - 1) {
    throw ApiError.badRequest('Order is already delivered')
  }
  const next = ORDER_PIPELINE[i + 1]
  if (next === 'Shipped') {
    if (!courier || !trackingId) throw ApiError.badRequest('Courier and tracking ID are required to ship')
    order.courier = courier
    order.trackingId = trackingId
  }
  order.status = next
  await order.save()
  await notifyUser(order.memberId, 'Order status changed', `Your order ${order.code} is now ${next}`)
  return order
}
