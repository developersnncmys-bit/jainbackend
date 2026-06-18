# Jain Patashala — Unified Backend

One Node.js + Express + MongoDB API serving all three frontends:

- **Super Admin Panel** (`super-admin-panel`, port 5175)
- **Community Admin Panel** (`community-admin-panel`, port 5174)
- **Member App** (`member-app`, Expo / 5176)

Money is stored in **paise**. Points live in an **append-only ledger** (balance =
sum of the ledger). Points + Gift-Wallet debits run inside MongoDB transactions
when a replica set is available, and fall back to sequential writes on a
standalone `mongod`.

## Stack

Express · Mongoose 8 · JWT (`jsonwebtoken`) · `bcryptjs` · `express-validator` ·
`helmet` · `cors` · `morgan`. ES modules throughout.

## Setup

```bash
cd backend
npm install
cp .env.example .env        # adjust MONGO_URI / JWT_SECRET
npm run seed                # wipe + load demo data and credentials
npm run dev                 # nodemon on http://localhost:5000
# or: npm start
```

Requires MongoDB. For real ACID transactions, point `MONGO_URI` at a replica set
or MongoDB Atlas; a standalone server also works (with the documented fallback).

## Demo credentials (after `npm run seed`)

| Role | Login |
|------|-------|
| Super Admin | `superadmin@jainpatashala.com` / `super123` |
| Principal | `principal@mahavir.com` / `principal123` |
| Community Admin | `admin@mahavir.com` / `admin123` |
| Member | phone `9876543210`, OTP `1234`, invite code `MAHAVIR24` |

## Architecture

```
src/
  config/      env + Mongo connection (detects transaction support)
  models/      Mongoose schemas (SOW §10) — User, Community, Gift, Order, …
  middleware/  protect (JWT), authorize (RBAC), sameCommunity, validate, error
  services/    business logic — pointsService, orderService, completionService
  controllers/ request handlers (thin; call services)
  routes/      Express routers, role-gated; mounted under /api
  seed/        demo data loader
```

Roles: `super_admin`, `principal`, `community_admin`, `member`. RBAC is enforced
**server-side on every route**, and non-super-admins are scoped to their own
community (multi-tenant isolation, SOW §14).

## Key API endpoints (all under `/api`)

**Auth**
- `POST /auth/admin/login` — email + password (admin/super admin)
- `POST /auth/member/request-otp` → `POST /auth/member/verify-otp` → `POST /auth/member/register`
- `GET  /auth/me`

**Super Admin** — communities, master content/templates, catalog, fulfillment, billing, analytics, config
- `POST /communities` · `PATCH /communities/:id/status` · `POST /communities/:id/topup`
- `POST /content` · `POST /templates` · `POST /gifts` · `POST /gifts/:id/restock` · `GET /gifts/low-stock`
- `GET  /orders` · `PATCH /orders/:id/advance` (courier + tracking at Shipped)
- `GET  /invoices` · `POST /invoices` · `PATCH /invoices/:id/status`
- `GET  /analytics/platform` · `GET /config` · `PATCH /config`

**Community Admin / Principal** — members, access, activities, approvals, bulk orders
- `GET/POST /members` · `POST /members/bulk` · `PATCH /members/:id/segment`
- `POST /access/grant` · `PATCH /access/:userId/revoke` · `GET /access/audit`
- `POST /activities` · `GET /completions/queue` · `PATCH /completions/:id/approve|reject`
- `POST /orders/bulk` · `GET /wallet/transactions` · `GET /analytics/community`

**Member** — feed, completions, points, store, redemption, orders
- `GET  /activities/feed` · `POST /completions`
- `GET  /points/ledger` · `GET /points/balance`
- `GET  /gifts` · `POST /orders/redeem` · `GET /orders`
- `GET  /notifications` · `PATCH /notifications/read-all`

## How the order flow works (verified end-to-end)

1. Member redeems a gift → `POST /orders/redeem`. In one transaction the API
   checks **stock**, **member balance**, and **community Gift Wallet**, then
   debits points (ledger), debits the wallet, decrements stock, and raises an order.
2. The order appears in the Super Admin queue (`GET /orders`).
3. Super Admin advances it `Placed → Confirmed → Packed → Shipped → Delivered`
   (`PATCH /orders/:id/advance`); shipping requires courier + tracking ID.
4. Each transition notifies the member.

## Connecting the frontends

Point each frontend at `http://localhost:5000/api`, send the JWT as
`Authorization: Bearer <token>`. The frontends currently mutate local mock state
in their `store` files — swap those mutations for `fetch`/`axios` calls to these
endpoints (the store functions are the single integration point). CORS already
allows the three dev ports (configurable via `CLIENT_ORIGINS`).
