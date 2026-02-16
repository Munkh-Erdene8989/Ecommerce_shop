# Supabase руу бичэлт хийх

Энэ апп Supabase-д **migrations** (schema) болон **seed** (анхны өгөгдөл) ашиглан бичнэ. Дараах алхамуудыг дагана уу.

---

## 0. Supabase CLI (заавал биш)

CLI суулгаагүй бол **npx** ашиглана:

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push
npx supabase db execute -f supabase/seed.sql
```

Эсвэл **Supabase Dashboard → SQL Editor** дээр `supabase/migrations/001_init.sql`, дараа нь `002_rls.sql`, эцэст нь `supabase/seed.sql` файлуудыг нэг нэгээр нь хуулж ажиллуулна.

---

## 1. Supabase төсөл холбох (нэг удаа, CLI ашиглавал)

Төслийн root-оос:

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
```

`<PROJECT_REF>` нь Supabase Dashboard → Project Settings → General → Reference ID (жишээ: `abcdefghijklmnop`).

---

## 2. Schema (migrations) Supabase руу бичих

Хүснэгтүүд болон RLS-ийг Supabase DB руу ачаална:

```bash
npm run db:migrate
```

Эсвэл CLI суулгаагүй бол:

```bash
npx supabase db push
```

Эсвэл **Dashboard → SQL Editor** дээр дарааллаар нь ажиллуулна:
1. `supabase/migrations/001_init.sql` (бүх хүснэгт)
2. `supabase/migrations/002_rls.sql` (RLS бодлогууд)

Энэ нь profiles, products, orders, coupons г.м хүснэгтүүдийг үүсгэнэ.

---

## 3. Анхны өгөгдөл (seed) бичих

Категори, брэнд, бүтээгдэхүүний жишээ өгөгдлийг оруулна:

```bash
npm run db:seed
```

Эсвэл:

```bash
npx supabase db execute -f supabase/seed.sql
```

Эсвэл **Supabase Dashboard → SQL Editor** дээр `supabase/seed.sql` файлын агуулгыг хуулж ажиллуулна.

---

## 4. Нэг дор migration + seed

```bash
npm run db:setup
```

Эсвэл:

```bash
npm run db:migrate && npm run db:seed
```

---

## 5. Апп доторх бичлэг (хэрхэн ажилладаг вэ)

| Хүснэгт / үйлдэл | Хэрэглэгчийн эрх (anon) | Backend (service_role) |
|------------------|------------------------|-------------------------|
| **profiles** | Өөрийн мөр insert/update (auth callback, upsert-profile) | Admin CRUD (GraphQL) |
| **orders** | Өөрийн захиалга insert | Бүх захиалга унших, status update |
| **order_items** | Өөрийн захиалгын дэлгэрэнгүй insert | Унших |
| **products** | Зөвхөн унших | CRUD (admin) |
| **coupons** | — | Admin CRUD |
| **payments** | — | Insert/update (QPay webhook) |
| **marketing_events** | — | Insert (API /events) |
| **inventory_movements** | — | Insert (stock өөрчлөлт) |

- **Server client** (`lib/supabase/server.ts`): `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` — RLS-ийн дагуу бичнэ (profiles, orders).
- **Admin client** (`lib/backend/supabase/adminClient.ts`): `SUPABASE_SERVICE_ROLE_KEY` — RLS-ийг тойрч admin бичлэг хийнэ (products, coupons, orders update г.м).

---

## 6. Шаардлагатай орчны хувьсагчид

`.env.local` дээр:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
```

Migration/seed нь Supabase CLI-аар ажилладаг (Dashboard эсвэл `supabase link`-ээр холбогдсон төсөл дээр). Апп-ын бичлэг нь дээрх env-ийг ашиглана.

---

## 7. Admin (owner) хэрэглэгч үүсгэх

Анхны admin эсвэл owner хэрэглэгчийг үүсгэхийн тулд:

1. **`.env.local`** дээр нэмнэ:
   ```env
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=нууц-үг-оруулна
   ```

2. Скрипт ажиллуулна:
   ```bash
   npm run create-admin
   ```

Энэ нь Supabase Auth-д имэйл/нууц үгтэй хэрэглэгч үүсгээд `profiles` хүснэгтэд `role = 'owner'` тохируулна.

3. **Нэвтрэх**: `/login` хуудас руу ороод "Имэйл + нууц үгээр нэвтрэх" сонголтоор дээрх имэйл/нууц үгээр нэвтэрч, дараа нь `/admin` руу орно.
