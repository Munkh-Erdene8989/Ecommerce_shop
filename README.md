# AZ Beauty – Нэгтгэсэн апп (Frontend + Backend)

Single-tenant ecommerce for BEAUTY/COSMETICS. Next.js frontend болон backend API нэг апп, нэг фолдер дотор нэгтгэсэн.

## Folder tree (нэг фолдер)

```
app/
  api/                 ← Backend API routes
    auth/ (me, bootstrap-owner, upsert-profile)
    events/
    graphql/           ← GraphQL endpoint
    health/
    payments/qpay/ (create, check, webhook)
  account/orders/
  admin/ (layout, page, products, orders, customers, inventory, promotions/coupons, marketing, settings)
  auth/callback/
  cart/
  category/[slug]/
  checkout/ (page, result/, success/)
  login/
  products/ (page, [slug]/)
  layout.tsx, page.tsx, globals.css
components/ (Header, Footer)
contexts/ (CartContext)
lib/
  apollo/client
  backend/             ← Backend логик (auth, email, graphql, payments, supabase, utils)
  shared/               ← Нэгдсэн shared (constants, types, schemas, coupon)
  supabase/client|server
  utils, events, providers
middleware.ts
supabase/
  migrations/ (001_init.sql, 002_rls.sql)
  seed.sql
package.json
README.md
```

## Tech stack

- **App**: Next.js 14 (App Router) + API Routes, TypeScript (strict), TailwindCSS
- **GraphQL**: Apollo Server (`/api/graphql`), Apollo Client
- **Backend**: Supabase (service role), QPay, Resend – бүгд `lib/backend/` болон `app/api/` дотор
- **DB**: Supabase Postgres + Auth + Storage + RLS

## Prerequisites

- Node.js 18+
- Supabase project
- Resend.com account (API key)
- QPay Mongolia merchant account (optional for local dev)

## 1. Supabase setup

**Зөв төсөл**: App-ийн `.env.local` дээрх `NEXT_PUBLIC_SUPABASE_URL` (жишээ нь `qyhsmgwpjoymyzysrzcf.supabase.co`) бүхий төсөл дээр л migration/seed ажиллуулна.

1. Create a project at [supabase.com](https://supabase.com).
2. Run migrations:
   - **Зөв төсөл дээр**: Dashboard → [project qyhsmgwpjoymyzysrzcf](https://supabase.com/dashboard/project/qyhsmgwpjoymyzysrzcf) → SQL Editor → `supabase/run_in_correct_project.sql` файлыг бүхлээр нь хуулж ажиллуулна (schema + RLS + seed нэг дор).
   - Эсвэл: `supabase/migrations/001_init.sql`, дараа нь `002_rls.sql`, дараа нь `supabase/seed.sql` гэж тусад нь ажиллуулна.
   - Or with Supabase CLI: `supabase db push` (if linked).
3. Run seed (optional): Хэрэв 2-т `run_in_correct_project.sql` ажиллуулаагүй бол SQL Editor → run `supabase/seed.sql`.
4. **Auth providers** (Dashboard → Authentication → Providers):
   - **Email**: Enable Email; enable “Confirm email” if you want OTP only.
   - **Google**: Enable, set Client ID/Secret; add redirect URL: `https://<your-app-domain>/auth/callback` (and `http://localhost:3000/auth/callback` for local).
   - **Facebook**: Enable, set App ID/Secret; add redirect URL same as above.
5. Copy **Project URL** and **anon key** (and **service_role** for backend).

## 2. Environment variables

### `.env.local` (нэг файл – frontend + backend тохиргоо)

Supabase API: **docs/SUPABASE_API.md** (хэрэв байвал).

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Backend API (сервер дээр л ашигладаг)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...

# QPay Mongolia
QPAY_API_URL=https://merchant.qpay.mn/v2
QPAY_USERNAME=...
QPAY_PASSWORD=...
QPAY_INVOICE_CODE=...
QPAY_CALLBACK_URL=http://localhost:3000/api/payments/qpay/webhook

# Resend
RESEND_API_KEY=re_...
EMAIL_FROM=AZ Beauty <noreply@yourdomain.com>
```

## 3. Run locally

From repo root:

```bash
npm install
npm run build -w packages/shared
npm run dev
# эсвэл: npm run dev -w apps/frontend
# → http://localhost:3000
# GraphQL: http://localhost:3000/api/graphql
# Health: http://localhost:3000/api/health
```

- Store: `/`, `/products`, `/products/[slug]`, `/category/[slug]`, `/cart`, `/checkout`, `/checkout/success`, `/account/orders`
- Auth: `/login`, `/auth/callback`
- Admin: `/admin`, `/admin/products`, `/admin/orders`, `/admin/customers`, `/admin/inventory`, `/admin/promotions/coupons`, `/admin/marketing`, `/admin/settings`, `/admin/audit`

### Admin roles and store settings

- **Admin roles** (middleware + GraphQL): `profiles.role IN ('owner','admin','manager','support')` — бүгд `/admin/*` руу нэвтэрнэ. SQL helper: `public.is_admin(uid)`.
- **Support role**: Захиалгын төлөв шинэчлэх + дотоод тэмдэглэл (order status + internal notes) боломжтой. **Бүтээгдэхүүний үнэ засах** (price, cost_price, original_price) нь Support дээр **идэвхгүй** — UI дээр эдгээр талбарыг disabled эсвэл нуух нь зөвлөмж (одоогийн хувилбарт бүх админ эрхтэй хэрэглэгч засварлах боломжтой; ирээдүйд support-д price талбаруудыг хаах боломжтой).
- **Store settings**: Нэмэлт хүснэгт `store_settings` (key/value, жишээ нь `general` → `{ store_name, logo_url, shipping_rate, free_shipping_threshold, tax_rate }`). Migration: `003_admin_audit_settings.sql`. Admin → Тохиргоо хуудаснаас засна.

## 4. Owner bootstrap

The first user can become **owner** (admin rights):

1. Sign in (Email OTP, Google, or Facebook).
2. Call API:
   ```bash
   curl -X POST http://localhost:3000/api/auth/bootstrap-owner \
     -H "Authorization: Bearer <SUPABASE_ACCESS_TOKEN>"
   ```
   Access token: from browser (Supabase session) or from Auth response.
3. Only the first caller becomes owner; later calls return “Owner already exists”.

## 5. Resend

- Sign up at [resend.com](https://resend.com), create API key.
- Set `RESEND_API_KEY` and `EMAIL_FROM` in `apps/frontend/.env.local`.
- Backend sends: order placed, payment confirmed (and optionally status updated).

## 6. QPay

- Use QPay Mongolia merchant credentials.
- Set `QPAY_*` in `apps/frontend/.env.local`.
- Frontend checkout: create order via GraphQL → `POST /api/payments/qpay/create` → show QR → poll `GET /api/payments/qpay/check?invoice_id=...` until paid → redirect to success.
- Optional webhook: `POST /api/payments/qpay/webhook` (QPay dashboard-д энэ URL тохируулна).

## 7. Deploy (Vercel)

### Frontend (Vercel)

**CLI-аар deploy хийх (анхны удаа):**

1. Vercel-д нэвтрэх:
   ```bash
   npx vercel login
   ```
2. Frontend-ээс deploy:
   ```bash
   cd apps/frontend && npx vercel
   ```
   (Асуувал: Link to existing project? → **ecommerce-shop** сонгох эсвэл шинэ project үүсгэнэ. Root Directory нь `apps/frontend` байхаар тохируулна.)
3. Дараагийн deploy: `cd apps/frontend && npx vercel --prod` эсвэл Git push (Vercel Git integration идэвхтэй бол).

**Vercel Dashboard тохиргоо (Git integration ашиглавал):**

1. [vercel.com](https://vercel.com) → Import/Add project → энэ repo-г холбоно.
2. Project Settings → **Root Directory** = `apps/frontend`.
3. **Environment Variables** (Vercel-д бүх .env.local хувьсагчуудыг тохируулна, дараахыг оролцуулан):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`
   - `QPAY_*`, `RESEND_*`, `EMAIL_FROM`
   - `QPAY_CALLBACK_URL` = `https://your-domain.vercel.app/api/payments/qpay/webhook`
4. Deploy: push to main эсвэл Vercel Dashboard → Deployments → Redeploy.

Backend API нь Next.js API routes болсон тул Vercel deploy хийхэд хамт байрлана. `QPAY_CALLBACK_URL` = `https://your-domain.vercel.app/api/payments/qpay/webhook` гэж тохируулна.

## 8. Splitting into separate repos (optional)

- **apps/frontend** (нэгтгэсэн app) → new repo: copy folder, add root `package.json`; replace `@repo/shared` with published package or copy `packages/shared` into app.

## 9. Tests

```bash
npm run test -w packages/shared
```

Runs Vitest unit tests for coupon calculation in `packages/shared`.
