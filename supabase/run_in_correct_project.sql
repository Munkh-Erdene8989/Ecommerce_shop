-- =============================================================================
-- AZ Beauty – ЗӨВ ТӨСӨЛД АЖИЛЛУУЛАХ (qyhsmgwpjoymyzysrzcf.supabase.co)
-- =============================================================================
-- Энэ файлыг Supabase Dashboard → SQL Editor дээр зөвхөн ДАРААХ төсөлд ажиллуулна:
-- https://supabase.com/dashboard/project/qyhsmgwpjoymyzysrzcf
-- (Frontend/Backend .env.local дээрх NEXT_PUBLIC_SUPABASE_URL-тай ижил)
-- Нэг удаа ажиллуулна.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (auth.users-тай холбоотой)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'owner')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Brands, Categories, Products
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  brand TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'skincare',
  price INTEGER NOT NULL,
  original_price INTEGER,
  cost_price INTEGER,
  image TEXT NOT NULL DEFAULT 'https://via.placeholder.com/300x300?text=No+Image',
  images TEXT[],
  barcode TEXT,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  in_stock BOOLEAN DEFAULT true,
  skin_type TEXT[] DEFAULT '{}',
  benefits TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  is_bestseller BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);

-- Coupons (orders-оос өмнө)
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('percent', 'fixed')),
  value INTEGER NOT NULL,
  min_order_amount INTEGER,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cart, Orders, Order items, Payments, Inventory, Marketing events
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  total INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  shipping_cost INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_method TEXT NOT NULL DEFAULT 'qpay',
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  qpay_invoice_id TEXT,
  qpay_qr_text TEXT,
  qpay_urls JSONB,
  shipping_address JSONB NOT NULL DEFAULT '{}',
  customer_info JSONB NOT NULL DEFAULT '{}',
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  qpay_invoice_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_qpay_invoice_id ON public.payments(qpay_invoice_id);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity_delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON public.inventory_movements(product_id);

CREATE TABLE IF NOT EXISTS public.marketing_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_name TEXT NOT NULL,
  page TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  product_id UUID,
  order_id UUID,
  value NUMERIC(12,2),
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketing_events_event_name ON public.marketing_events(event_name);
CREATE INDEX IF NOT EXISTS idx_marketing_events_created_at ON public.marketing_events(created_at);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "brands_select" ON public.brands;
CREATE POLICY "brands_select" ON public.brands FOR SELECT USING (true);
DROP POLICY IF EXISTS "categories_select" ON public.categories;
CREATE POLICY "categories_select" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "products_select" ON public.products;
CREATE POLICY "products_select" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "cart_select" ON public.cart_items;
DROP POLICY IF EXISTS "cart_insert" ON public.cart_items;
DROP POLICY IF EXISTS "cart_update" ON public.cart_items;
DROP POLICY IF EXISTS "cart_delete" ON public.cart_items;
CREATE POLICY "cart_select" ON public.cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cart_insert" ON public.cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cart_update" ON public.cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cart_delete" ON public.cart_items FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_select" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
DROP POLICY IF EXISTS "orders_update" ON public.orders;
CREATE POLICY "orders_select" ON public.orders FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);
CREATE POLICY "orders_insert_own" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_update" ON public.orders FOR UPDATE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
CREATE POLICY "order_items_select" ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
    AND (o.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')))
  )
);
CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "payments_select" ON public.payments;
CREATE POLICY "payments_select" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

DROP POLICY IF EXISTS "coupons_select" ON public.coupons;
CREATE POLICY "coupons_select" ON public.coupons FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

DROP POLICY IF EXISTS "inventory_select" ON public.inventory_movements;
CREATE POLICY "inventory_select" ON public.inventory_movements FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

DROP POLICY IF EXISTS "marketing_events_select" ON public.marketing_events;
CREATE POLICY "marketing_events_select" ON public.marketing_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

-- =============================================================================
-- SEED – Анхны өгөгдөл
-- =============================================================================

INSERT INTO public.categories (id, name, slug) VALUES
  (uuid_generate_v4(), 'Арьс арчилгаа', 'skincare'),
  (uuid_generate_v4(), 'Нүүрний будаг', 'makeup'),
  (uuid_generate_v4(), 'Үсний бүтээгдэхүүн', 'hair'),
  (uuid_generate_v4(), 'Маск', 'masks'),
  (uuid_generate_v4(), 'Нарнаас хамгаалах', 'suncare')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.brands (id, name, slug) VALUES
  (uuid_generate_v4(), 'Laneige', 'laneige'),
  (uuid_generate_v4(), 'Innisfree', 'innisfree'),
  (uuid_generate_v4(), 'COSRX', 'cosrx'),
  (uuid_generate_v4(), 'Etude House', 'etude-house')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, brand, category, price, original_price, stock_quantity, image, description, in_stock, skin_type, benefits, is_featured, is_new, is_bestseller) VALUES
  ('Laneige Water Sleeping Mask', 'laneige-water-sleeping-mask', 'Laneige', 'skincare', 85000, 95000, 50, 'https://via.placeholder.com/300x300?text=Laneige+Mask', 'Шөнийн усан маск - арьсыг чийгшүүлнэ.', true, ARRAY['normal', 'dry'], ARRAY['чийгшүүлэгч', 'сэргээгч'], true, true, true),
  ('COSRX Advanced Snail 96 Mucin', 'cosrx-advanced-snail-96-mucin', 'COSRX', 'skincare', 45000, NULL, 100, 'https://via.placeholder.com/300x300?text=COSRX+Snail', 'Сармагчин эсиййн essence - арьсыг эрүүлжүүлнэ.', true, ARRAY['all'], ARRAY['сэргээгч', 'тугалмал'], true, false, true),
  ('Innisfree Green Tea Seed Serum', 'innisfree-green-tea-seed-serum', 'Innisfree', 'skincare', 65000, 72000, 80, 'https://via.placeholder.com/300x300?text=Innisfree+Serum', 'Ногоон цайны үрийн serum - чийгшүүлэгч.', true, ARRAY['normal', 'dry', 'oily'], ARRAY['чийгшүүлэгч', 'антиоксидант'], true, false, false)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.coupons (id, code, type, value, min_order_amount, max_uses, used_count, valid_from, valid_until)
VALUES (uuid_generate_v4(), 'WELCOME10', 'percent', 10, 30000, 1000, 0, now(), now() + interval '1 year')
ON CONFLICT (code) DO NOTHING;
