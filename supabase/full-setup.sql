-- =============================================
-- AZ Beauty - Supabase Database Schema
-- =============================================
-- Run this in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. Profiles table (extends auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
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

-- =============================================
-- 2. Products table
-- =============================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
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

-- =============================================
-- 3. Cart Items table
-- =============================================
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- =============================================
-- 4. Orders table
-- =============================================
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 5. Order Items table
-- =============================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all, update own
CREATE POLICY "Profiles: Public read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles: Own update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profiles: Own insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Products: Everyone can read, admin can CRUD
CREATE POLICY "Products: Public read" ON public.products FOR SELECT USING (true);
CREATE POLICY "Products: Admin insert" ON public.products FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Products: Admin update" ON public.products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Products: Admin delete" ON public.products FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Cart: Users can CRUD own items
CREATE POLICY "Cart: Own read" ON public.cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Cart: Own insert" ON public.cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Cart: Own update" ON public.cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Cart: Own delete" ON public.cart_items FOR DELETE USING (auth.uid() = user_id);

-- Orders: Users can read own, admin can read all
CREATE POLICY "Orders: Own read" ON public.orders FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Orders: Own insert" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Orders: Admin update" ON public.orders FOR UPDATE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Order Items: Same as orders
CREATE POLICY "Order Items: Related read" ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND (orders.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  )
);
CREATE POLICY "Order Items: Insert for own orders" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products(in_stock);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);


-- =============================================
-- AZ Beauty - Seed Data
-- Generated from: Барааны жагсаалт 2026-02-08
-- Total products: 457
-- =============================================

-- Clear existing products (optional - comment out if you want to append)
-- TRUNCATE public.products CASCADE;

INSERT INTO public.products (name, brand, category, price, cost_price, barcode, stock_quantity, image, description, in_stock, is_new, is_featured, is_bestseller) VALUES
  ('tsair', NULL, 'skincare', 55000, 55000, '096619237401', 10, 'https://via.placeholder.com/300x300?text=tsair', 'tsair', true, false, false, false),
  ('b complex', NULL, 'supplements', 65000, 65000, '196633914538', 10, 'https://via.placeholder.com/300x300?text=b%20complex', 'b complex', true, false, false, false),
  ('medipeel hyal vitamin', 'Medipeel', 'skincare', 1500, NULL, '8809941822021', 0, 'https://via.placeholder.com/300x300?text=medipeel%20hyal%20vitami', 'medipeel hyal vitamin - Medipeel', false, false, false, false),
  ('mask', NULL, 'masks', 1500, NULL, NULL, 0, 'https://via.placeholder.com/300x300?text=mask', 'mask', false, false, false, false),
  ('medipeel', 'Medipeel', 'skincare', 1500, 1500, '8809941822014', 0, 'https://via.placeholder.com/300x300?text=medipeel', 'medipeel - Medipeel', false, false, false, false),
  ('anna nogoon', NULL, 'skincare', 21000, 21000, '085715296122', 0, 'https://via.placeholder.com/300x300?text=anna%20nogoon', 'anna nogoon', false, false, false, false),
  ('anna ygaan', NULL, 'skincare', 21000, 21000, '085715064059', 0, 'https://via.placeholder.com/300x300?text=anna%20ygaan', 'anna ygaan', false, false, false, false),
  ('tsvnh', NULL, 'skincare', 10000, NULL, NULL, 0, 'https://via.placeholder.com/300x300?text=tsvnh', 'tsvnh', false, false, false, false),
  ('sharaw mask', NULL, 'masks', 2500, NULL, NULL, 0, 'https://via.placeholder.com/300x300?text=sharaw%20mask', 'sharaw mask', false, false, false, false),
  ('gift set', NULL, 'skincare', 45000, NULL, '8806109104425', 0, 'https://via.placeholder.com/300x300?text=gift%20set', 'gift set', false, false, false, false),
  ('tefal', NULL, 'skincare', 150000, NULL, '3168430370968', 0, 'https://via.placeholder.com/300x300?text=tefal', 'tefal', false, false, false, false),
  ('pdrn shar', NULL, 'skincare', 15000, NULL, '8800260613789', 0, 'https://via.placeholder.com/300x300?text=pdrn%20shar', 'pdrn shar', false, false, false, false),
  ('pdrn tsenher', NULL, 'skincare', 15000, NULL, '8800260613444', 0, 'https://via.placeholder.com/300x300?text=pdrn%20tsenher', 'pdrn tsenher', false, false, false, false),
  ('pdrn nogoon', NULL, 'skincare', 15000, NULL, '8800260613833', 0, 'https://via.placeholder.com/300x300?text=pdrn%20nogoon', 'pdrn nogoon', false, false, false, false),
  ('multi care vitamin mask', NULL, 'masks', 1500, NULL, '8809381692475', 0, 'https://via.placeholder.com/300x300?text=multi%20care%20vitamin%20m', 'multi care vitamin mask', false, false, false, false),
  ('labiotte 2 simple', NULL, 'skincare', 300, NULL, '300303', 0, 'https://via.placeholder.com/300x300?text=labiotte%202%20simple', 'labiotte 2 simple', false, false, false, false),
  ('labiotte eyecream', NULL, 'skincare', 300, NULL, '300302', 0, 'https://via.placeholder.com/300x300?text=labiotte%20eyecream', 'labiotte eyecream', false, false, false, false),
  ('labiotte spf30', NULL, 'suncare', 300, NULL, '300301', 0, 'https://via.placeholder.com/300x300?text=labiotte%20spf30', 'labiotte spf30', false, false, false, false),
  ('ygaan sormuusni budag maybdona', NULL, 'skincare', 8000, NULL, '8809696980953', 0, 'https://via.placeholder.com/300x300?text=ygaan%20sormuusni%20buda', 'ygaan sormuusni budag maybdona', false, false, false, false),
  ('LANEIGE cleansing oil blue', 'Laneige', 'skincare', 2500, NULL, '20260413', 0, 'https://via.placeholder.com/300x300?text=LANEIGE%20cleansing%20oi', 'LANEIGE cleansing oil blue - Laneige', false, false, false, false),
  ('real glow mask', NULL, 'masks', 15000, NULL, '8809192706347', 0, 'https://via.placeholder.com/300x300?text=real%20glow%20mask', 'real glow mask', false, false, false, false),
  ('Jm tiger mask', 'JM', 'masks', 1500, NULL, '8809711715317', 0, 'https://via.placeholder.com/300x300?text=Jm%20tiger%20mask', 'Jm tiger mask - JM', false, false, false, false),
  ('bb cream', NULL, 'skincare', 7000, NULL, '8809408730012', 0, 'https://via.placeholder.com/300x300?text=bb%20cream', 'bb cream', false, false, false, false),
  ('temporary vita c', NULL, 'skincare', 1000, NULL, '8809623299936', 0, 'https://via.placeholder.com/300x300?text=temporary%20vita%20c', 'temporary vita c', false, false, false, false),
  ('temporary collagen', NULL, 'skincare', 1000, NULL, '8809623299929', 0, 'https://via.placeholder.com/300x300?text=temporary%20collagen', 'temporary collagen', false, false, false, false),
  ('temporary peptide', NULL, 'skincare', 1000, NULL, '8809623299912', 0, 'https://via.placeholder.com/300x300?text=temporary%20peptide', 'temporary peptide', false, false, false, false),
  ('sneakers', NULL, 'skincare', 80000, NULL, '8804973308604', 0, 'https://via.placeholder.com/300x300?text=sneakers', 'sneakers', false, false, false, false),
  ('ulaan zapas', NULL, 'skincare', 5000, NULL, NULL, 0, 'https://via.placeholder.com/300x300?text=ulaan%20zapas', 'ulaan zapas', false, false, false, false),
  ('ohui tsenher kom', NULL, 'skincare', 130000, NULL, '8809949522657', 1, 'https://via.placeholder.com/300x300?text=ohui%20tsenher%20kom', 'ohui tsenher kom', true, false, false, false),
  ('ohui ygaan kom', NULL, 'skincare', 240000, NULL, '8809949512276', 1, 'https://via.placeholder.com/300x300?text=ohui%20ygaan%20kom', 'ohui ygaan kom', true, false, false, false),
  ('usnii sav', NULL, 'skincare', 80000, 80000, '885395103457', 10, 'https://via.placeholder.com/300x300?text=usnii%20sav', 'usnii sav', true, false, false, false),
  ('narnii tos vegan innisfree', 'Innisfree', 'skincare', 20000, 20000, '8809843677989', 700, 'https://via.placeholder.com/300x300?text=narnii%20tos%20vegan%20inn', 'narnii tos vegan innisfree - Innisfree', true, false, false, true),
  ('Tsvnh', NULL, 'skincare', 10000, 10000, '8806403794872', 0, 'https://via.placeholder.com/300x300?text=Tsvnh', 'Tsvnh', false, false, false, false),
  ('powder Delacroix', NULL, 'makeup', 10000, 10000, '8809294554808', 0, 'https://via.placeholder.com/300x300?text=powder%20Delacroix', 'powder Delacroix', false, false, false, false),
  ('uudg cindella', NULL, 'skincare', 25000, 25000, '8809648833740', 0, 'https://via.placeholder.com/300x300?text=uudg%20cindella', 'uudg cindella', false, false, false, false),
  ('mogin hortoi tos', NULL, 'skincare', 15000, 15000, '8806421010220', 0, 'https://via.placeholder.com/300x300?text=mogin%20hortoi%20tos', 'mogin hortoi tos', false, false, false, false),
  ('jm kontur', 'JM', 'skincare', 10000, 10000, '8809562560418', 0, 'https://via.placeholder.com/300x300?text=jm%20kontur', 'jm kontur - JM', false, false, false, false),
  ('huuuldg mask', NULL, 'masks', 15000, 15000, '8809192706378', 0, 'https://via.placeholder.com/300x300?text=huuuldg%20mask', 'huuuldg mask', false, false, false, false),
  ('Ato mist', NULL, 'skincare', 12000, 12000, '8809555452638', 0, 'https://via.placeholder.com/300x300?text=Ato%20mist', 'Ato mist', false, false, false, false),
  ('SLEEK TOS', NULL, 'skincare', 15000, 15000, '20260530', 0, 'https://via.placeholder.com/300x300?text=SLEEK%20TOS', 'SLEEK TOS', false, false, false, false),
  ('SLEEK OIL AMPOULE', NULL, 'skincare', 15000, 15000, '20260531', 0, 'https://via.placeholder.com/300x300?text=SLEEK%20OIL%20AMPOULE', 'SLEEK OIL AMPOULE', false, false, false, false),
  ('sleek simple', NULL, 'skincare', 1000, 1000, '20260529', 0, 'https://via.placeholder.com/300x300?text=sleek%20simple', 'sleek simple', false, false, false, false),
  ('Butter bichen shirhgeer', NULL, 'household', 700, 700, '8994251001850', 0, 'https://via.placeholder.com/300x300?text=Butter%20bichen%20shirhg', 'Butter bichen shirhgeer', false, false, false, false),
  ('jeju nil yagaan serum', NULL, 'skincare', 15000, 15000, '8809605876223', 120, 'https://via.placeholder.com/300x300?text=jeju%20nil%20yagaan%20seru', 'jeju nil yagaan serum', true, false, false, true),
  ('jeju suguk mist', NULL, 'skincare', 15000, 15000, '8809605876216', 33, 'https://via.placeholder.com/300x300?text=jeju%20suguk%20mist', 'jeju suguk mist', true, false, false, false),
  ('Skeek kom', NULL, 'accessories', 29000, 29000, '29000', 0, 'https://via.placeholder.com/300x300?text=Skeek%20kom', 'Skeek kom', false, false, false, false),
  ('Temporary mask', NULL, 'masks', 1500, 1500, '8809623299905', 0, 'https://via.placeholder.com/300x300?text=Temporary%20mask', 'Temporary mask', false, false, false, false),
  ('Urgamliin tos 2sh', NULL, 'household', 45000, 45000, '8801039208663', 0, 'https://via.placeholder.com/300x300?text=Urgamliin%20tos%202sh', 'Urgamliin tos 2sh', false, false, false, false),
  ('Tsotsgiii bichen', NULL, 'household', 45000, 45000, '8994251001652', 0, 'https://via.placeholder.com/300x300?text=Tsotsgiii%20bichen', 'Tsotsgiii bichen', false, false, false, false),
  ('Ten Ten', NULL, 'household', 41500, 41500, '8806124261646', 0, 'https://via.placeholder.com/300x300?text=Ten%20Ten', 'Ten Ten', false, false, false, false),
  ('zuurdg mask 1sh', NULL, 'masks', 2500, 2500, '8809534610080', 0, 'https://via.placeholder.com/300x300?text=zuurdg%20mask%201sh', 'zuurdg mask 1sh', false, false, false, false),
  ('Almond choko', NULL, 'household', 4000, 4000, '8801062634330', 0, 'https://via.placeholder.com/300x300?text=Almond%20choko', 'Almond choko', false, false, false, false),
  ('batganii naalt', NULL, 'skincare', 650, 650, '7898692981591', 0, 'https://via.placeholder.com/300x300?text=batganii%20naalt', 'batganii naalt', false, false, false, false),
  ('Anua vit c serum', 'Anua', 'skincare', 17900, 17900, '8809640733055', 0, 'https://via.placeholder.com/300x300?text=Anua%20vit%20c%20serum', 'Anua vit c serum - Anua', false, false, false, false),
  ('Purito tos', 'Purito', 'skincare', 10450, 10450, '8809563103430', 0, 'https://via.placeholder.com/300x300?text=Purito%20tos', 'Purito tos - Purito', false, false, false, false),
  ('Huluutai tsai', NULL, 'skincare', 19500, 19500, '8809698232784', 0, 'https://via.placeholder.com/300x300?text=Huluutai%20tsai', 'Huluutai tsai', false, false, false, false),
  ('Vs scrab', NULL, 'skincare', 25000, 25000, '8806190724403', 0, 'https://via.placeholder.com/300x300?text=Vs%20scrab', 'Vs scrab', false, false, false, false),
  ('huwtsas', NULL, 'skincare', 20000, 20000, '20000', 0, 'https://via.placeholder.com/300x300?text=huwtsas', 'huwtsas', false, false, false, false),
  ('Jm zowhi tos sarnaitai', 'JM', 'skincare', 25000, 25000, '8809505544932', 0, 'https://via.placeholder.com/300x300?text=Jm%20zowhi%20tos%20sarnait', 'Jm zowhi tos sarnaitai - JM', false, false, false, false),
  ('Luna sponj', NULL, 'skincare', 2000, 2000, '20001', 0, 'https://via.placeholder.com/300x300?text=Luna%20sponj', 'Luna sponj', false, false, false, false),
  ('Holikey kom', NULL, 'accessories', 50000, 50000, '8809445614993', 0, 'https://via.placeholder.com/300x300?text=Holikey%20kom', 'Holikey kom', false, false, false, false),
  ('nabor shig mask', NULL, 'masks', 1000, 1000, '8809462420348', 5050, 'https://via.placeholder.com/300x300?text=nabor%20shig%20mask', 'nabor shig mask', true, false, false, true),
  ('Tos Cledbel', NULL, 'skincare', 15000, 15000, '15000', 0, 'https://via.placeholder.com/300x300?text=Tos%20Cledbel', 'Tos Cledbel', false, false, false, false),
  ('Shawar mask', NULL, 'masks', 2500, 2500, '8809482770874', 0, 'https://via.placeholder.com/300x300?text=Shawar%20mask', 'Shawar mask', false, false, false, false),
  ('ZOGIIN JILLI', NULL, 'household', 95000, 95000, '9327155008721', 0, 'https://via.placeholder.com/300x300?text=ZOGIIN%20JILLI', 'ZOGIIN JILLI', false, false, false, false),
  ('Jm krem 21 nomer', 'JM', 'makeup', 12500, 12500, '8809562561415', 0, 'https://via.placeholder.com/300x300?text=Jm%20krem%2021%20nomer', 'Jm krem 21 nomer - JM', false, false, false, false),
  ('vs boolt 1000', NULL, 'skincare', 1000, 1000, '99999', 0, 'https://via.placeholder.com/300x300?text=vs%20boolt%201000', 'vs boolt 1000', false, false, false, false),
  ('holiin mask', NULL, 'masks', 1000, 5000, '8809623295303', 396, 'https://via.placeholder.com/300x300?text=holiin%20mask', 'holiin mask', true, false, false, true),
  ('Choko krem', NULL, 'skincare', 22000, 22000, '2087686065804', 0, 'https://via.placeholder.com/300x300?text=Choko%20krem', 'Choko krem', false, false, false, false),
  ('nvd ten', NULL, 'skincare', 7500, 7500, '8809502260200', 0, 'https://via.placeholder.com/300x300?text=nvd%20ten', 'nvd ten', false, false, false, false),
  ('Langage uruul mask', NULL, 'masks', 3800, 3800, '38001', 0, 'https://via.placeholder.com/300x300?text=Langage%20uruul%20mask', 'Langage uruul mask', false, false, false, false),
  ('tseltsegnvvr', NULL, 'household', 600, 600, '4711269692061', 0, 'https://via.placeholder.com/300x300?text=tseltsegnvvr', 'tseltsegnvvr', false, false, false, false),
  ('sormuus hyamsaa', NULL, 'accessories', 1000, NULL, '33333', 0, 'https://via.placeholder.com/300x300?text=sormuus%20hyamsaa', 'sormuus hyamsaa', false, false, false, false),
  ('Snow white kom', NULL, 'skincare', 99000, 99000, '8809420950948', 0, 'https://via.placeholder.com/300x300?text=Snow%20white%20kom', 'Snow white kom', false, false, false, false),
  ('guujuulagch', NULL, 'skincare', 11000, NULL, '8809631877935', 0, 'https://via.placeholder.com/300x300?text=guujuulagch', 'guujuulagch', false, false, false, false),
  ('Angaahai Samar', NULL, 'household', 79000, 79000, '096619453788', 0, 'https://via.placeholder.com/300x300?text=Angaahai%20Samar', 'Angaahai Samar', false, false, false, false),
  ('Gal togoonii alchuur', NULL, 'household', 49900, 49900, '8801166034180', 0, 'https://via.placeholder.com/300x300?text=Gal%20togoonii%20alchuur', 'Gal togoonii alchuur', false, false, false, false),
  ('RICHAM', NULL, 'household', 8500, 6000, '8801047181699', 0, 'https://via.placeholder.com/300x300?text=RICHAM', 'RICHAM', false, false, false, false),
  ('Lemon shvvs', NULL, 'household', 33000, 33000, '8800287770021', 0, 'https://via.placeholder.com/300x300?text=Lemon%20shvvs', 'Lemon shvvs', false, false, false, false),
  ('Туна төмс чинжүүтэй', NULL, 'skincare', 6500, 6000, '8801075011647', 0, 'https://via.placeholder.com/300x300?text=%D0%A2%D1%83%D0%BD%D0%B0%C2%A0%D1%82%D3%A9%D0%BC%D1%81%C2%A0%D1%87%D0%B8%D0%BD%D0%B6%D2%AF%D2%AF%D1%82%D1%8D%D0%B9', 'Туна төмс чинжүүтэй', false, false, false, false),
  ('Туна лаазалсан зөөлөн', NULL, 'skincare', 6500, 6000, '8801075010923', 0, 'https://via.placeholder.com/300x300?text=%D0%A2%D1%83%D0%BD%D0%B0%C2%A0%D0%BB%D0%B0%D0%B0%D0%B7%D0%B0%D0%BB%D1%81%D0%B0%D0%BD%C2%A0%D0%B7%D3%A9%D3%A9%D0%BB%D3%A9', 'Туна лаазалсан зөөлөн', false, false, false, false),
  ('soruultai undaa', NULL, 'skincare', 2500, 2500, '8801043650311', 0, 'https://via.placeholder.com/300x300?text=soruultai%20undaa', 'soruultai undaa', false, false, false, false),
  ('Tuna', NULL, 'household', 7500, 7500, '8801047119296', 0, 'https://via.placeholder.com/300x300?text=Tuna', 'Tuna', false, false, false, false),
  ('Nutella shagshuurga', NULL, 'skincare', 6000, 6000, '009800800056', 0, 'https://via.placeholder.com/300x300?text=Nutella%20shagshuurga', 'Nutella shagshuurga', false, false, false, false),
  ('Noir vnerten', NULL, 'fragrance', 15000, 15000, '8809640731914', 0, 'https://via.placeholder.com/300x300?text=Noir%20vnerten', 'Noir vnerten', false, false, false, false),
  ('jelyy cherry', NULL, 'skincare', 25000, 25000, '208809698230483', 0, 'https://via.placeholder.com/300x300?text=jelyy%20cherry', 'jelyy cherry', false, false, false, false),
  ('huurai sawan', NULL, 'skincare', 750, 750, '8809339905930', 0, 'https://via.placeholder.com/300x300?text=huurai%20sawan', 'huurai sawan', false, false, false, false),
  ('Maxim coffee svvtei', 'VT', 'household', 1000, 1000, '8801037050745', 0, 'https://via.placeholder.com/300x300?text=Maxim%20coffee%20svvtei', 'Maxim coffee svvtei - VT', false, false, false, false),
  ('Jantai goimn', NULL, 'household', 3000, 3000, '8801045033181', 0, 'https://via.placeholder.com/300x300?text=Jantai%20goimn', 'Jantai goimn', false, false, false, false),
  ('JEJU 500 ML', NULL, 'skincare', 10000, 10000, '8809503231247', 1, 'https://via.placeholder.com/300x300?text=JEJU%20500%20ML', 'JEJU 500 ML', true, false, false, false),
  ('shagshuurga  1sh', NULL, 'household', 6000, 6000, '8997237721117', 0, 'https://via.placeholder.com/300x300?text=shagshuurga%20%201sh', 'shagshuurga  1sh', false, false, false, false),
  ('Tahia', NULL, 'household', 49900, 49900, '8801492633545', 0, 'https://via.placeholder.com/300x300?text=Tahia', 'Tahia', false, false, false, false),
  ('vs ampoule +mist', NULL, 'skincare', 25000, 25000, '8809783321287', 0, 'https://via.placeholder.com/300x300?text=vs%20ampoule%20%2Bmist', 'vs ampoule +mist', false, false, false, false),
  ('tonic lotion 500ml', NULL, 'skincare', 22000, 22000, '8033413020374', 0, 'https://via.placeholder.com/300x300?text=tonic%20lotion%20500ml', 'tonic lotion 500ml', false, false, false, false),
  ('guujuulagch', NULL, 'skincare', 11000, 11000, '8809631877911', 0, 'https://via.placeholder.com/300x300?text=guujuulagch', 'guujuulagch', false, false, false, false),
  ('tone up tos', NULL, 'skincare', 7900, 7900, '8809803050821', 0, 'https://via.placeholder.com/300x300?text=tone%20up%20tos', 'tone up tos', false, false, false, false),
  ('homsg harandaa', NULL, 'skincare', 2500, 2500, '8809485973425', 0, 'https://via.placeholder.com/300x300?text=homsg%20harandaa', 'homsg harandaa', false, false, false, false),
  ('Garcina turaah bakter', NULL, 'skincare', 18000, 25000, '8809164669106', 0, 'https://via.placeholder.com/300x300?text=Garcina%20turaah%20bakte', 'Garcina turaah bakter', false, false, false, false),
  ('Karadium krem', NULL, 'makeup', 25000, 25000, '8809406892859', 0, 'https://via.placeholder.com/300x300?text=Karadium%20krem', 'Karadium krem', false, false, false, false),
  ('Nerstei C vita', NULL, 'skincare', 9900, 9900, '8809257880111', 0, 'https://via.placeholder.com/300x300?text=Nerstei%20C%20vita', 'Nerstei C vita', false, false, false, false),
  ('Collagen mask  Halavi', NULL, 'masks', 1000, 1000, '8809803051194', 0, 'https://via.placeholder.com/300x300?text=Collagen%20mask%20%20Halav', 'Collagen mask  Halavi', false, false, false, false),
  ('Honinii ehes', NULL, 'skincare', 25000, 25000, '8800342540125', 0, 'https://via.placeholder.com/300x300?text=Honinii%20ehes', 'Honinii ehes', false, false, false, false),
  ('ABC jelly', 'ABC', 'skincare', 25000, 25000, '8809698232227', 0, 'https://via.placeholder.com/300x300?text=ABC%20jelly', 'ABC jelly - ABC', false, false, false, false),
  ('svvder bags', NULL, 'skincare', 2500, 2500, '8809523890981', 7, 'https://via.placeholder.com/300x300?text=svvder%20bags', 'svvder bags', true, false, false, false),
  ('sormus', NULL, 'accessories', 4500, 3500, '6978290501757', 0, 'https://via.placeholder.com/300x300?text=sormus', 'sormus', false, false, false, false),
  ('Naadg sormus', NULL, 'accessories', 9900, 9900, '6976544931664', 50, 'https://via.placeholder.com/300x300?text=Naadg%20sormus', 'Naadg sormus', true, false, false, false),
  ('am mask 10sh', NULL, 'masks', 6500, 6500, '8801675558269', 0, 'https://via.placeholder.com/300x300?text=am%20mask%2010sh', 'am mask 10sh', false, false, false, false),
  ('vita c 280sh', NULL, 'supplements', 29900, 29900, '8801244313923', 0, 'https://via.placeholder.com/300x300?text=vita%20c%20280sh', 'vita c 280sh', false, false, false, false),
  ('Jm krem 21 nopmer', 'JM', 'makeup', 12500, 12500, '8809562561408', 0, 'https://via.placeholder.com/300x300?text=Jm%20krem%2021%20nopmer', 'Jm krem 21 nopmer - JM', false, false, false, false),
  ('Anua balm budg arilgh', 'Anua', 'makeup', 15000, 15000, '8809640734991', 0, 'https://via.placeholder.com/300x300?text=Anua%20balm%20budg%20arilg', 'Anua balm budg arilgh - Anua', false, false, false, false),
  ('c vita nerstei', NULL, 'skincare', 9900, 9900, '57880111', 0, 'https://via.placeholder.com/300x300?text=c%20vita%20nerstei', 'c vita nerstei', false, false, false, false),
  ('vERSAGE TSENHER 5ML', NULL, 'skincare', 21900, 21900, '8011003839155', 0, 'https://via.placeholder.com/300x300?text=vERSAGE%20TSENHER%205ML', 'vERSAGE TSENHER 5ML', false, false, false, false),
  ('Montblanc red 100ml', NULL, 'fragrance', 140000, 140000, '3386460128001', 0, 'https://via.placeholder.com/300x300?text=Montblanc%20red%20100ml', 'Montblanc red 100ml', false, false, false, false),
  ('Versage yagaan', NULL, 'fragrance', 22500, 22500, '8011003993871', 0, 'https://via.placeholder.com/300x300?text=Versage%20yagaan', 'Versage yagaan', false, false, false, false),
  ('VERSAGE', NULL, 'fragrance', 22000, 22000, '8018365071032', 0, 'https://via.placeholder.com/300x300?text=VERSAGE', 'VERSAGE', false, false, false, false),
  ('280sh Vita c', NULL, 'skincare', 29900, 29900, '8801244315477', 0, 'https://via.placeholder.com/300x300?text=280sh%20Vita%20c', '280sh Vita c', false, false, false, false),
  ('omicel guujuulagch', NULL, 'skincare', 15000, 15000, '8809600690985', 0, 'https://via.placeholder.com/300x300?text=omicel%20guujuulagch', 'omicel guujuulagch', false, false, false, false),
  ('gelen zowhi mask', NULL, 'masks', 20000, 20000, '8809239802582', 0, 'https://via.placeholder.com/300x300?text=gelen%20zowhi%20mask', 'gelen zowhi mask', false, false, false, false),
  ('Anartai tsai', NULL, 'household', 15000, 15000, '8801517440011', 0, 'https://via.placeholder.com/300x300?text=Anartai%20tsai', 'Anartai tsai', false, false, false, false),
  ('Dior uruul onglogch', NULL, 'skincare', 85000, 98000, '98000', 20, 'https://via.placeholder.com/300x300?text=Dior%20uruul%20onglogch', 'Dior uruul onglogch', true, false, true, false),
  ('tsenher mist', NULL, 'skincare', 15000, 15000, '8809530201312', 0, 'https://via.placeholder.com/300x300?text=tsenher%20mist', 'tsenher mist', false, false, false, false),
  ('jm krew', 'JM', 'skincare', 12500, 12500, '8809562560470', 0, 'https://via.placeholder.com/300x300?text=jm%20krew', 'jm krew - JM', false, false, false, false),
  ('shv oo', NULL, 'skincare', 5000, 5000, '8809552278941', 0, 'https://via.placeholder.com/300x300?text=shv%20oo', 'shv oo', false, false, false, false),
  ('Anna+ shono  tos Omega3 6 9', NULL, 'supplements', 7500, 7500, '8809338572744', 0, 'https://via.placeholder.com/300x300?text=Anna%2B%20shono%20%20tos%20Ome', 'Anna+ shono  tos Omega3 6 9', false, false, false, false),
  ('77% Anua toner', 'Anua', 'skincare', 10000, 12000, '8809640734694', 0, 'https://via.placeholder.com/300x300?text=77%25%20Anua%20toner', '77% Anua toner - Anua', false, false, false, false),
  ('nogoon chips shirhgeer', NULL, 'skincare', 1300, 1300, '8886467112881', 0, 'https://via.placeholder.com/300x300?text=nogoon%20chips%20shirhge', 'nogoon chips shirhgeer', false, false, false, false),
  ('PORORO C', 'Pororo', 'skincare', 7900, 7900, '8809563635153', 0, 'https://via.placeholder.com/300x300?text=PORORO%20C', 'PORORO C - Pororo', false, false, false, false),
  ('noiton salpitka', NULL, 'skincare', 2500, 2500, '8809436966018', 100, 'https://via.placeholder.com/300x300?text=noiton%20salpitka', 'noiton salpitka', true, false, false, true),
  ('Christmas   alag chiher', NULL, 'skincare', 39900, 39900, '825924917575', 0, 'https://via.placeholder.com/300x300?text=Christmas%20%20%20alag%20chi', 'Christmas   alag chiher', false, false, false, false),
  ('crysmass candy', NULL, 'skincare', 45000, 45000, '722678137580', 0, 'https://via.placeholder.com/300x300?text=crysmass%20candy', 'crysmass candy', false, false, false, false),
  ('Jelly alag', NULL, 'skincare', 45000, 45000, '4711269693648', 0, 'https://via.placeholder.com/300x300?text=Jelly%20alag', 'Jelly alag', false, false, false, false),
  ('Mango', NULL, 'skincare', 29900, 29900, '8938553804627', 0, 'https://via.placeholder.com/300x300?text=Mango', 'Mango', false, false, false, false),
  ('Haribo uuttai', NULL, 'skincare', 35000, 35000, '8803420902532', 0, 'https://via.placeholder.com/300x300?text=Haribo%20uuttai', 'Haribo uuttai', false, false, false, false),
  ('Coffeetoi chiher', NULL, 'skincare', 45000, 45000, '5410381000592', 0, 'https://via.placeholder.com/300x300?text=Coffeetoi%20chiher', 'Coffeetoi chiher', false, false, false, false),
  ('300sh chups', NULL, 'household', 55000, 55000, '8809234908012', 0, 'https://via.placeholder.com/300x300?text=300sh%20chups', '300sh chups', false, false, false, false),
  ('hasibo shirheg', NULL, 'skincare', 500, 500, '500001', 0, 'https://via.placeholder.com/300x300?text=hasibo%20shirheg', 'hasibo shirheg', false, false, false, false),
  ('5 shtei shagshuurga', NULL, 'household', 29900, 29900, '8997237721933', 0, 'https://via.placeholder.com/300x300?text=5%20shtei%20shagshuurga', '5 shtei shagshuurga', false, false, false, false),
  ('hvvhdiin ogloonii tsai', NULL, 'skincare', 17500, 17500, '8801083001425', 0, 'https://via.placeholder.com/300x300?text=hvvhdiin%20ogloonii%20ts', 'hvvhdiin ogloonii tsai', false, false, false, false),
  ('Mini choko 8400', NULL, 'household', 8400, 8400, '8801019313929', 0, 'https://via.placeholder.com/300x300?text=Mini%20choko%208400', 'Mini choko 8400', false, false, false, false),
  ('Almond tsenher uuttai', NULL, 'household', 45000, 45000, '2000001293171', 0, 'https://via.placeholder.com/300x300?text=Almond%20tsenher%20uutta', 'Almond tsenher uuttai', false, false, false, false),
  ('tomato ketchup', NULL, 'household', 25000, 21100, '8801065104601', 0, 'https://via.placeholder.com/300x300?text=tomato%20ketchup', 'tomato ketchup', false, false, false, false),
  ('Mini choco', NULL, 'skincare', 42000, 42000, '8801019319747', 0, 'https://via.placeholder.com/300x300?text=Mini%20choco', 'Mini choco', false, false, false, false),
  ('Choco pie', NULL, 'household', 1000, 1000, '8801117539818', 0, 'https://via.placeholder.com/300x300?text=Choco%20pie', 'Choco pie', false, false, false, false),
  ('Haribo hairtsagtai', NULL, 'household', 38900, 38900, '4001686805169', 0, 'https://via.placeholder.com/300x300?text=Haribo%20hairtsagtai', 'Haribo hairtsagtai', false, false, false, false),
  ('Chips nogoon', NULL, 'skincare', 38500, 38500, '8886467115868', 0, 'https://via.placeholder.com/300x300?text=Chips%20nogoon', 'Chips nogoon', false, false, false, false),
  ('mezclar cushn+zapastai', NULL, 'skincare', 55000, 55000, '8809495899197', 0, 'https://via.placeholder.com/300x300?text=mezclar%20cushn%2Bzapast', 'mezclar cushn+zapastai', false, false, false, false),
  ('Untlaganii mask laneige huh', 'Laneige', 'masks', 3800, 3800, '20271110', 330, 'https://via.placeholder.com/300x300?text=Untlaganii%20mask%20lane', 'Untlaganii mask laneige huh - Laneige', true, false, false, true),
  ('vs boolt', NULL, 'skincare', 3000, 3000, '222222', 0, 'https://via.placeholder.com/300x300?text=vs%20boolt', 'vs boolt', false, false, false, false),
  ('Anua 77% toner', 'Anua', 'skincare', 10000, 12000, '8809640731433', 0, 'https://via.placeholder.com/300x300?text=Anua%2077%25%20toner', 'Anua 77% toner - Anua', false, false, false, false),
  ('labiotte 2toi simple', NULL, 'skincare', 500, 500, '500500', 0, 'https://via.placeholder.com/300x300?text=labiotte%202toi%20simple', 'labiotte 2toi simple', false, false, false, false),
  ('BUDG ARILGAGCH JIJIG', NULL, 'makeup', 2500, 2500, '10000', 0, 'https://via.placeholder.com/300x300?text=BUDG%20ARILGAGCH%20JIJIG', 'BUDG ARILGAGCH JIJIG', false, false, false, false),
  ('kaltsi vit C', NULL, 'skincare', 29900, 29900, '8809257880227', 0, 'https://via.placeholder.com/300x300?text=kaltsi%20vit%20C', 'kaltsi vit C', false, false, false, false),
  ('am mask', NULL, 'masks', 6000, 6000, '60000', 0, 'https://via.placeholder.com/300x300?text=am%20mask', 'am mask', false, false, false, false),
  ('collagen 5000', NULL, 'skincare', 5000, 5000, '8809955120847', 0, 'https://via.placeholder.com/300x300?text=collagen%205000', 'collagen 5000', false, false, false, false),
  ('mezclar cushn 23', NULL, 'skincare', 25000, 25000, '8809495899135', 0, 'https://via.placeholder.com/300x300?text=mezclar%20cushn%2023', 'mezclar cushn 23', false, false, false, false),
  ('mezclar cushion', NULL, 'makeup', 25000, 25000, '8809495899111', 0, 'https://via.placeholder.com/300x300?text=mezclar%20cushion', 'mezclar cushion', false, false, false, false),
  ('Bioten collagen', NULL, 'skincare', 16000, 16000, '8809955120601', 0, 'https://via.placeholder.com/300x300?text=Bioten%20collagen', 'Bioten collagen', false, false, false, false),
  ('hambug mask', NULL, 'masks', 1000, 1000, '8809462424551', 0, 'https://via.placeholder.com/300x300?text=hambug%20mask', 'hambug mask', false, false, false, false),
  ('anua nigth cream', 'Anua', 'skincare', 19000, 19000, '8809640734953', 0, 'https://via.placeholder.com/300x300?text=anua%20nigth%20cream', 'anua nigth cream - Anua', false, false, false, false),
  ('viski', NULL, 'skincare', 90000, 90000, '5011007003005', 0, 'https://via.placeholder.com/300x300?text=viski', 'viski', false, false, false, false),
  ('uruuliin budg', NULL, 'makeup', 5000, 5000, '8809758802568', 0, 'https://via.placeholder.com/300x300?text=uruuliin%20budg', 'uruuliin budg', false, false, false, false),
  ('anua pad zadgai', 'Anua', 'skincare', 500, 500, '8809640730832', 0, 'https://via.placeholder.com/300x300?text=anua%20pad%20zadgai', 'anua pad zadgai - Anua', false, false, false, false),
  ('medipeel tos', 'Medipeel', 'skincare', 33000, 33000, '8809941820430', 0, 'https://via.placeholder.com/300x300?text=medipeel%20tos', 'medipeel tos - Medipeel', false, false, false, false),
  ('The history tsagaan kom', NULL, 'skincare', 175900, 175900, '8801051479621', 3, 'https://via.placeholder.com/300x300?text=The%20history%20tsagaan%20', 'The history tsagaan kom', true, false, false, false),
  ('Hvn horhoidoi a/b', NULL, 'skincare', 10000, 12500, '20260526', 0, 'https://via.placeholder.com/300x300?text=Hvn%20horhoidoi%20a%2Fb', 'Hvn horhoidoi a/b', false, false, false, false),
  ('Glow krem', NULL, 'skincare', 9900, 9900, '8809084080128', 0, 'https://via.placeholder.com/300x300?text=Glow%20krem', 'Glow krem', false, false, false, false),
  ('J m mask b3', NULL, 'masks', 1500, 1500, '8809852547662', 0, 'https://via.placeholder.com/300x300?text=J%20m%20mask%20b3', 'J m mask b3', false, false, false, false),
  ('JM mask', 'JM', 'masks', 1500, 1500, '8809852546801', 0, 'https://via.placeholder.com/300x300?text=JM%20mask', 'JM mask - JM', false, false, false, false),
  ('DEXAZE SHAMPOON', NULL, 'hair', 10000, 10000, '8809754073276', 0, 'https://via.placeholder.com/300x300?text=DEXAZE%20SHAMPOON', 'DEXAZE SHAMPOON', false, false, false, false),
  ('kaltsi D vita', NULL, 'skincare', 22000, 22000, '8809549094868', 0, 'https://via.placeholder.com/300x300?text=kaltsi%20D%20vita', 'kaltsi D vita', false, false, false, false),
  ('bor cushn', NULL, 'skincare', 5000, 5000, '731509682564', 0, 'https://via.placeholder.com/300x300?text=bor%20cushn', 'bor cushn', false, false, false, false),
  ('jm tos', 'JM', 'skincare', 15000, 15000, '8809442161742', 0, 'https://via.placeholder.com/300x300?text=jm%20tos', 'jm tos - JM', false, false, false, false),
  ('hambug mask', NULL, 'masks', 1000, 1000, '8809295015971', 0, 'https://via.placeholder.com/300x300?text=hambug%20mask', 'hambug mask', false, false, false, false),
  ('jm ampoule mask', 'JM', 'skincare', 1500, 1500, '8809711714402', 0, 'https://via.placeholder.com/300x300?text=jm%20ampoule%20mask', 'jm ampoule mask - JM', false, false, false, false),
  ('jm mask bird', 'JM', 'masks', 1500, 1500, '8809505547650', 0, 'https://via.placeholder.com/300x300?text=jm%20mask%20bird', 'jm mask bird - JM', false, false, false, false),
  ('ergtei mask', NULL, 'masks', 1800, 1800, '8809495894369', 0, 'https://via.placeholder.com/300x300?text=ergtei%20mask', 'ergtei mask', false, false, false, false),
  ('Anua toson tsewerlegch', 'Anua', 'skincare', 19000, 19000, '8809640732829', 0, 'https://via.placeholder.com/300x300?text=Anua%20toson%20tsewerleg', 'Anua toson tsewerlegch - Anua', false, false, false, false),
  ('uruuliin budag', NULL, 'skincare', 5000, 5000, '8809758802575', 0, 'https://via.placeholder.com/300x300?text=uruuliin%20budag', 'uruuliin budag', false, false, false, false),
  ('anua toner 77', 'Anua', 'skincare', 12000, 12000, '8809640732140', 0, 'https://via.placeholder.com/300x300?text=anua%20toner%2077', 'anua toner 77 - Anua', false, false, false, false),
  ('anua milk serum', 'Anua', 'skincare', 25000, 25000, '8809640733956', 0, 'https://via.placeholder.com/300x300?text=anua%20milk%20serum', 'anua milk serum - Anua', false, false, false, false),
  ('KOM', NULL, 'skincare', 240000, NULL, NULL, 0, 'https://via.placeholder.com/300x300?text=KOM', 'KOM', false, false, false, false),
  ('KOM175900', NULL, 'skincare', 175900, NULL, NULL, 0, 'https://via.placeholder.com/300x300?text=KOM175900', 'KOM175900', false, false, false, false),
  ('narorin', NULL, 'skincare', 7700, 7700, '0108806453000411', 0, 'https://via.placeholder.com/300x300?text=narorin', 'narorin', false, false, false, false),
  ('anua toner 2huwi', 'Anua', 'skincare', 19000, 19000, '8809640734519', 0, 'https://via.placeholder.com/300x300?text=anua%20toner%202huwi', 'anua toner 2huwi - Anua', false, false, false, false),
  ('anua pad sawtai', 'Anua', 'skincare', 29000, 28000, '8809640731884', 0, 'https://via.placeholder.com/300x300?text=anua%20pad%20sawtai', 'anua pad sawtai - Anua', false, false, false, false),
  ('anua ampoule 80', 'Anua', 'skincare', 19000, 20000, '8809640732133', 0, 'https://via.placeholder.com/300x300?text=anua%20ampoule%2080', 'anua ampoule 80 - Anua', false, false, false, false),
  ('anua milk toner', 'Anua', 'skincare', 19000, 20000, '8809640734656', 0, 'https://via.placeholder.com/300x300?text=anua%20milk%20toner', 'anua milk toner - Anua', false, false, false, false),
  ('anua milk cream', 'Anua', 'skincare', 20000, 20000, '8809640734632', 0, 'https://via.placeholder.com/300x300?text=anua%20milk%20cream', 'anua milk cream - Anua', false, false, false, false),
  ('anua toner lotion', 'Anua', 'skincare', 24900, 24900, '8809640731426', 0, 'https://via.placeholder.com/300x300?text=anua%20toner%20lotion', 'anua toner lotion - Anua', false, false, false, false),
  ('anua oil', 'Anua', 'skincare', 19000, 20000, '8809640734076', 118, 'https://via.placeholder.com/300x300?text=anua%20oil', 'anua oil - Anua', true, false, false, true),
  ('anua foam', 'Anua', 'skincare', 19000, 20000, 'X003WZNKPN', 76, 'https://via.placeholder.com/300x300?text=anua%20foam', 'anua foam - Anua', true, false, false, true),
  ('Tsangis', NULL, 'skincare', 45000, 53000, '031200021113', 0, 'https://via.placeholder.com/300x300?text=Tsangis', 'Tsangis', false, false, false, false),
  ('mcm unertei us', NULL, 'skincare', 29000, 29000, '085715151049', 51, 'https://via.placeholder.com/300x300?text=mcm%20unertei%20us', 'mcm unertei us', true, false, false, true),
  ('vita c', NULL, 'skincare', 9900, 11000, '8809257880104', 0, 'https://via.placeholder.com/300x300?text=vita%20c', 'vita c', false, false, false, false),
  ('ten', NULL, 'skincare', 7500, NULL, '8809502260194', 0, 'https://via.placeholder.com/300x300?text=ten', 'ten', false, false, false, false),
  ('hoos', NULL, 'skincare', 1500, 1500, '8809339905930httpwwwkulabnet', 0, 'https://via.placeholder.com/300x300?text=hoos', 'hoos', false, false, false, false),
  ('vnerten', NULL, 'fragrance', 5000, NULL, '8805301003376', 0, 'https://via.placeholder.com/300x300?text=vnerten', 'vnerten', false, false, false, false),
  ('sawtai zuurdg mask', NULL, 'masks', 9000, 9000, '9328425101', 0, 'https://via.placeholder.com/300x300?text=sawtai%20zuurdg%20mask', 'sawtai zuurdg mask', false, false, false, false),
  ('vdl primer', NULL, 'makeup', 20000, 9900, '8801342642031', 0, 'https://via.placeholder.com/300x300?text=vdl%20primer', 'vdl primer', false, false, false, false),
  ('nogooon kom 3tai 1+1', NULL, 'accessories', 30000, 30000, '30000', 0, 'https://via.placeholder.com/300x300?text=nogooon%20kom%203tai%201%2B1', 'nogooon kom 3tai 1+1', false, false, false, false),
  ('medi   sarnai zuurdg mask', NULL, 'masks', 4000, 4000, '8809409342528', 0, 'https://via.placeholder.com/300x300?text=medi%20%20%20sarnai%20zuurdg', 'medi   sarnai zuurdg mask', false, false, false, false),
  ('uruuliin yagaan balm', NULL, 'skincare', 3800, 3800, '380038', 0, 'https://via.placeholder.com/300x300?text=uruuliin%20yagaan%20balm', 'uruuliin yagaan balm', false, false, false, false),
  ('uruulii bal, yagaan', NULL, 'skincare', 3800, 3800, '20280409', 0, 'https://via.placeholder.com/300x300?text=uruulii%20bal%2C%20yagaan', 'uruulii bal, yagaan', false, false, false, false),
  ('jijig legend white', NULL, 'skincare', 21000, 21000, '3386460074919', 0, 'https://via.placeholder.com/300x300?text=jijig%20legend%20white', 'jijig legend white', false, false, false, false),
  ('legend 100ml', NULL, 'skincare', 135000, 140000, '3386460032681', 28, 'https://via.placeholder.com/300x300?text=legend%20100ml', 'legend 100ml', true, false, true, false),
  ('lanvin unertei us', NULL, 'skincare', 21000, 21000, '3386460077231', 25, 'https://via.placeholder.com/300x300?text=lanvin%20unertei%20us', 'lanvin unertei us', true, false, false, false),
  ('brillant tos', NULL, 'skincare', 7500, 7500, '8809383948907', 0, 'https://via.placeholder.com/300x300?text=brillant%20tos', 'brillant tos', false, false, false, false),
  ('Apple vs tos', NULL, 'skincare', 15000, 10000, '8809121705267', 0, 'https://via.placeholder.com/300x300?text=Apple%20vs%20tos', 'Apple vs tos', false, false, false, false),
  ('kontur', NULL, 'skincare', 8000, 8000, '8809696980670', 0, 'https://via.placeholder.com/300x300?text=kontur', 'kontur', false, false, false, false),
  ('hamar  mask', NULL, 'masks', 1000, 1000, '8809120645946', 0, 'https://via.placeholder.com/300x300?text=hamar%20%20mask', 'hamar  mask', false, false, false, false),
  ('jeju 500 ml', NULL, 'skincare', 10000, 10000, '8809794732041', 104, 'https://via.placeholder.com/300x300?text=jeju%20500%20ml', 'jeju 500 ml', true, false, false, true),
  ('jm mask', 'JM', 'masks', 1500, 1500, '8809505541047', 0, 'https://via.placeholder.com/300x300?text=jm%20mask', 'jm mask - JM', false, false, false, false),
  ('uruuliin balm', NULL, 'skincare', 3800, NULL, '20280204', 0, 'https://via.placeholder.com/300x300?text=uruuliin%20balm', 'uruuliin balm', false, false, false, false),
  ('alltai mask', NULL, 'masks', 750, 750, '8809739570011', 0, 'https://via.placeholder.com/300x300?text=alltai%20mask', 'alltai mask', false, false, false, false),
  ('lizcell mask', NULL, 'masks', 1500, 1500, 'lizcell.', 0, 'https://via.placeholder.com/300x300?text=lizcell%20mask', 'lizcell mask', false, false, false, false),
  ('uuttai mask', NULL, 'masks', 500, 500, '8809733214638', 0, 'https://via.placeholder.com/300x300?text=uuttai%20mask', 'uuttai mask', false, false, false, false),
  ('Hushgatai tsai', NULL, 'skincare', 19500, 19500, '8809698232166', 206, 'https://via.placeholder.com/300x300?text=Hushgatai%20tsai', 'Hushgatai tsai', true, false, false, true),
  ('ayga tavag ugaagc', NULL, 'skincare', 10000, 10000, '8002849492390', 2, 'https://via.placeholder.com/300x300?text=ayga%20tavag%20ugaagc', 'ayga tavag ugaagc', true, false, false, false),
  ('Uushginii bakteri', NULL, 'skincare', 17500, 17500, '8809668708073', 58, 'https://via.placeholder.com/300x300?text=Uushginii%20bakteri', 'Uushginii bakteri', true, false, false, true),
  ('labiotte zovhi', NULL, 'skincare', 300, 300, '300300', 47776, 'https://via.placeholder.com/300x300?text=labiotte%20zovhi', 'labiotte zovhi', true, false, false, true),
  ('biyiin tos tsairuulagctai', NULL, 'body', 7500, 7500, '8809035140277', 160, 'https://via.placeholder.com/300x300?text=biyiin%20tos%20tsairuula', 'biyiin tos tsairuulagctai', true, false, false, true),
  ('celeste gel foam', NULL, 'skincare', 15000, 15000, '8809803051484', 500, 'https://via.placeholder.com/300x300?text=celeste%20gel%20foam', 'celeste gel foam', true, false, false, true),
  ('elegnii ashigtai bakteri', NULL, 'skincare', 12000, 16000, '8809107717338', 161, 'https://via.placeholder.com/300x300?text=elegnii%20ashigtai%20bak', 'elegnii ashigtai bakteri', true, false, false, true),
  ('emegteichuudiin balm', NULL, 'skincare', 27500, 27500, '8809722155959', 106, 'https://via.placeholder.com/300x300?text=emegteichuudiin%20balm', 'emegteichuudiin balm', true, false, false, true),
  ('bambain ashigtai bakteri', NULL, 'skincare', 13500, 13500, '8809107714610', 88, 'https://via.placeholder.com/300x300?text=bambain%20ashigtai%20bak', 'bambain ashigtai bakteri', true, false, false, true),
  ('Dr young primer', NULL, 'makeup', 7500, 7500, '8809249511092', 187, 'https://via.placeholder.com/300x300?text=Dr%20young%20primer', 'Dr young primer', true, false, false, true),
  ('ue muchnii d', NULL, 'skincare', 27000, 27000, '8809955120366', 31, 'https://via.placeholder.com/300x300?text=ue%20muchnii%20d', 'ue muchnii d', true, false, false, false),
  ('Jm zowhi mask', 'JM', 'masks', 5000, 5000, '8809711716192', 2907, 'https://via.placeholder.com/300x300?text=Jm%20zowhi%20mask', 'Jm zowhi mask - JM', true, false, false, true),
  ('Anaashtai vitamin', NULL, 'supplements', 7500, 7500, '8809807283546', 176, 'https://via.placeholder.com/300x300?text=Anaashtai%20vitamin', 'Anaashtai vitamin', true, false, false, true),
  ('Hodoodnii ashigtai bakteri super19', NULL, 'skincare', 11000, 11500, '8809549092581', 96, 'https://via.placeholder.com/300x300?text=Hodoodnii%20ashigtai%20b', 'Hodoodnii ashigtai bakteri super19', true, false, false, true),
  ('emegteichuudiin ashigtai bakteri', NULL, 'skincare', 12000, 12000, '8809854722340', 127, 'https://via.placeholder.com/300x300?text=emegteichuudiin%20ashi', 'emegteichuudiin ashigtai bakteri', true, false, false, true),
  ('Noir bulchirhain ashigtai bakteri', NULL, 'skincare', 18000, 16000, '8809549097593', 493, 'https://via.placeholder.com/300x300?text=Noir%20bulchirhain%20ash', 'Noir bulchirhain ashigtai bakteri', true, false, false, true),
  ('apprat', NULL, 'skincare', 59000, 59000, '59000', 5, 'https://via.placeholder.com/300x300?text=apprat', 'apprat', true, false, false, false),
  ('Jimmy choo unertei us', NULL, 'skincare', 21000, 21000, '3386460025843', 7, 'https://via.placeholder.com/300x300?text=Jimmy%20choo%20unertei%20u', 'Jimmy choo unertei us', true, false, false, false),
  ('marry me unertei us jijig', NULL, 'skincare', 21000, 21000, '3386460024723', 4, 'https://via.placeholder.com/300x300?text=marry%20me%20unertei%20us%20', 'marry me unertei us jijig', true, false, false, false),
  ('har jijig legend 5ml', NULL, 'skincare', 20000, 20000, '3386460101097', 2, 'https://via.placeholder.com/300x300?text=har%20jijig%20legend%205ml', 'har jijig legend 5ml', true, false, false, false),
  ('jimmy choo ulaan 40ml', NULL, 'skincare', 140000, 140000, '3386460119276', 2, 'https://via.placeholder.com/300x300?text=jimmy%20choo%20ulaan%2040m', 'jimmy choo ulaan 40ml', true, false, false, false),
  ('ulaan legend 30ml', NULL, 'skincare', 85000, 85000, '3386460127981', 5, 'https://via.placeholder.com/300x300?text=ulaan%20legend%2030ml', 'ulaan legend 30ml', true, false, false, false),
  ('jimmy choo bollosom', NULL, 'skincare', 135000, 135000, '3386460066297', 6, 'https://via.placeholder.com/300x300?text=jimmy%20choo%20bollosom', 'jimmy choo bollosom', true, false, false, false),
  ('versage unertei us', NULL, 'skincare', 140000, 140000, '8011003818136', 7, 'https://via.placeholder.com/300x300?text=versage%20unertei%20us', 'versage unertei us', true, false, false, false),
  ('beelii', NULL, 'skincare', 7000, 7000, '8809327492169', 87, 'https://via.placeholder.com/300x300?text=beelii', 'beelii', true, false, false, true),
  ('uruuliin balm abib', 'Abib', 'skincare', 7500, 7500, '8809562555414', 803, 'https://via.placeholder.com/300x300?text=uruuliin%20balm%20abib', 'uruuliin balm abib - Abib', true, false, false, true),
  ('lizcell ampoule mask', NULL, 'skincare', 1500, 1500, '8809803050203', 1000, 'https://via.placeholder.com/300x300?text=lizcell%20ampoule%20mask', 'lizcell ampoule mask', true, false, false, true),
  ('humsugnii harandaa', NULL, 'skincare', 2500, 2500, '8809485975887', 1130, 'https://via.placeholder.com/300x300?text=humsugnii%20harandaa', 'humsugnii harandaa', true, false, false, true),
  ('Humsug sormuusnii himi', NULL, 'skincare', 12500, 12500, '8809690480640', 613, 'https://via.placeholder.com/300x300?text=Humsug%20sormuusnii%20hi', 'Humsug sormuusnii himi', true, false, false, true),
  ('Lactofit 50sh', NULL, 'skincare', 28000, 28000, '8805915679219', 168, 'https://via.placeholder.com/300x300?text=Lactofit%2050sh', 'Lactofit 50sh', true, false, false, true),
  ('nazorin', NULL, 'skincare', 7700, 7700, '770000', 10, 'https://via.placeholder.com/300x300?text=nazorin', 'nazorin', true, false, false, false),
  ('age 20 ampoule', NULL, 'skincare', 10000, 10000, '8801046340028', 108, 'https://via.placeholder.com/300x300?text=age%2020%20ampoule', 'age 20 ampoule', true, false, false, true),
  ('Turaah detox', NULL, 'skincare', 140000, 140000, '8936146860227', 24, 'https://via.placeholder.com/300x300?text=Turaah%20detox', 'Turaah detox', true, false, true, false),
  ('jkona shavar mask', NULL, 'masks', 2500, 2500, '8809711719223', 500, 'https://via.placeholder.com/300x300?text=jkona%20shavar%20mask', 'jkona shavar mask', true, false, false, true),
  ('vok shar', NULL, 'skincare', 29900, 29900, '033200000709', 17, 'https://via.placeholder.com/300x300?text=vok%20shar', 'vok shar', true, false, false, false),
  ('medipeel rose mask', 'Medipeel', 'skincare', 1500, 1500, '8809409340852', 464, 'https://via.placeholder.com/300x300?text=medipeel%20rose%20mask', 'medipeel rose mask - Medipeel', true, false, false, true),
  ('sponge set', NULL, 'skincare', 6250, 6250, '8809857460003', 26, 'https://via.placeholder.com/300x300?text=sponge%20set', 'sponge set', true, false, false, false),
  ('esleg yagaan', NULL, 'skincare', 5000, 5000, '8801128307420', 132, 'https://via.placeholder.com/300x300?text=esleg%20yagaan', 'esleg yagaan', true, false, false, true),
  ('Tsenher esleg', NULL, 'skincare', 5000, 5000, '8801128422796', 296, 'https://via.placeholder.com/300x300?text=Tsenher%20esleg', 'Tsenher esleg', true, false, false, true),
  ('har teni', NULL, 'skincare', 7500, 7500, '8809502260217', 401, 'https://via.placeholder.com/300x300?text=har%20teni', 'har teni', true, false, false, true),
  ('ygaan teni duh', NULL, 'skincare', 7500, 7500, '8809609791485', 857, 'https://via.placeholder.com/300x300?text=ygaan%20teni%20duh', 'ygaan teni duh', true, false, false, true),
  ('jm mascara', 'JM', 'makeup', 10000, 10000, '8809562561347', 689, 'https://via.placeholder.com/300x300?text=jm%20mascara', 'jm mascara - JM', true, false, false, true),
  ('pororo biyiin savan', 'Pororo', 'body', 10000, 9000, '8809099643813', 177, 'https://via.placeholder.com/300x300?text=pororo%20biyiin%20savan', 'pororo biyiin savan - Pororo', true, false, false, true),
  ('AHA PHA pad', NULL, 'skincare', 19000, 19000, '8809803051361', 58, 'https://via.placeholder.com/300x300?text=AHA%20PHA%20pad', 'AHA PHA pad', true, false, false, true),
  ('Moonshot primer', 'Moonshot', 'makeup', 7500, 7500, '8809636440141', 247, 'https://via.placeholder.com/300x300?text=Moonshot%20primer', 'Moonshot primer - Moonshot', true, false, false, true),
  ('salpitka', NULL, 'skincare', 2000, 2000, '200020', 5, 'https://via.placeholder.com/300x300?text=salpitka', 'salpitka', true, false, false, false),
  ('jelly zugiin  balt', NULL, 'skincare', 25000, 25000, '8809698232203', 21, 'https://via.placeholder.com/300x300?text=jelly%20zugiin%20%20balt', 'jelly zugiin  balt', true, false, false, false),
  ('celeste guujuulagc', NULL, 'skincare', 15000, 15000, '8809803051491', 402, 'https://via.placeholder.com/300x300?text=celeste%20guujuulagc', 'celeste guujuulagc', true, false, false, true),
  ('jm sleep', 'JM', 'skincare', 9900, 9900, '8809711715652', 5, 'https://via.placeholder.com/300x300?text=jm%20sleep', 'jm sleep - JM', true, false, false, false),
  ('Kundal shampoo jijig', NULL, 'hair', 2500, 2500, '8809568747691', 254, 'https://via.placeholder.com/300x300?text=Kundal%20shampoo%20jijig', 'Kundal shampoo jijig', true, false, false, true),
  ('jelly anar', NULL, 'skincare', 24000, 24000, '8809698232661', 180, 'https://via.placeholder.com/300x300?text=jelly%20anar', 'jelly anar', true, false, false, true),
  ('laneige lip balm', 'Laneige', 'makeup', 3800, 3800, '20280506', 390, 'https://via.placeholder.com/300x300?text=laneige%20lip%20balm', 'laneige lip balm - Laneige', true, false, false, true),
  ('Brillant mask', NULL, 'masks', 750, 750, '8809383948921', 10, 'https://via.placeholder.com/300x300?text=Brillant%20mask', 'Brillant mask', true, false, false, false),
  ('juvena', NULL, 'suncare', 29500, 29500, '9007867765265', 34, 'https://via.placeholder.com/300x300?text=juvena', 'juvena', true, false, false, false),
  ('huwtsanii vnertei us tom', NULL, 'fragrance', 10000, 10000, '8805301008906', 159, 'https://via.placeholder.com/300x300?text=huwtsanii%20vnertei%20us', 'huwtsanii vnertei us tom', true, false, false, true),
  ('Energy nil ygaan jelly', NULL, 'skincare', 16500, 16500, '8809495078097', 76, 'https://via.placeholder.com/300x300?text=Energy%20nil%20ygaan%20jel', 'Energy nil ygaan jelly', true, false, false, true),
  ('uuttai mask', NULL, 'masks', 500, 500, '8809733214621', 14307, 'https://via.placeholder.com/300x300?text=uuttai%20mask', 'uuttai mask', true, false, false, true),
  ('Budag arilgagc balm vitamin c', NULL, 'skincare', 15000, 15000, '8806173482184', 140, 'https://via.placeholder.com/300x300?text=Budag%20arilgagc%20balm%20', 'Budag arilgagc balm vitamin c', true, false, false, true),
  ('amni kf94 mask', NULL, 'masks', 5000, 5000, '500000', 106, 'https://via.placeholder.com/300x300?text=amni%20kf94%20mask', 'amni kf94 mask', true, false, false, true),
  ('Real collagen', NULL, 'skincare', 12500, 12500, '8809309727715', 100, 'https://via.placeholder.com/300x300?text=Real%20collagen', 'Real collagen', true, false, false, true),
  ('huzuunii tos medipeel', 'Medipeel', 'skincare', 35000, 35000, '8809409345550', 169, 'https://via.placeholder.com/300x300?text=huzuunii%20tos%20medipee', 'huzuunii tos medipeel - Medipeel', true, false, true, true),
  ('GC mask', NULL, 'masks', 750, 750, '8809803051118', 2434, 'https://via.placeholder.com/300x300?text=GC%20mask', 'GC mask', true, false, false, true),
  ('Alttai ulaan mask', NULL, 'masks', 750, 750, '8809739570004', 1048, 'https://via.placeholder.com/300x300?text=Alttai%20ulaan%20mask', 'Alttai ulaan mask', true, false, false, true),
  ('uuttai mask', NULL, 'masks', 500, 500, '8809733217561', 3140, 'https://via.placeholder.com/300x300?text=uuttai%20mask', 'uuttai mask', true, false, false, true),
  ('Yagaan uurag', NULL, 'skincare', 22000, 22000, '8809807282488', 23, 'https://via.placeholder.com/300x300?text=Yagaan%20uurag', 'Yagaan uurag', true, false, false, false),
  ('Cream rucir', NULL, 'skincare', 13750, 13750, '8809635721234', 87, 'https://via.placeholder.com/300x300?text=Cream%20rucir', 'Cream rucir', true, false, false, true),
  ('uuttai mask', NULL, 'masks', 500, 500, '8809733217578', 810, 'https://via.placeholder.com/300x300?text=uuttai%20mask', 'uuttai mask', true, false, false, true),
  ('lemon mask', NULL, 'masks', 500, 500, '8809085105967', 868, 'https://via.placeholder.com/300x300?text=lemon%20mask', 'lemon mask', true, false, false, true),
  ('4', NULL, 'skincare', 19900, 19900, '19900', 4, 'https://via.placeholder.com/300x300?text=4', '4', true, false, false, false),
  ('Agaar chiigshuulegch', NULL, 'skincare', 50000, 50000, '8809254531092', 20, 'https://via.placeholder.com/300x300?text=Agaar%20chiigshuulegch', 'Agaar chiigshuulegch', true, false, true, false),
  ('Celeste skin pdrn mask', NULL, 'masks', 1500, 1500, '8809803051644', 5705, 'https://via.placeholder.com/300x300?text=Celeste%20skin%20pdrn%20ma', 'Celeste skin pdrn mask', true, false, false, true),
  ('Tseverlegch us collagentei', NULL, 'skincare', 15000, 12000, '8809445615808', 227, 'https://via.placeholder.com/300x300?text=Tseverlegch%20us%20colla', 'Tseverlegch us collagentei', true, false, false, true),
  ('budag arilgagc salpetik 10sh', NULL, 'skincare', 1700, 1700, '8806076009563', 745, 'https://via.placeholder.com/300x300?text=budag%20arilgagc%20salpe', 'budag arilgagc salpetik 10sh', true, false, false, true),
  ('star mist', NULL, 'skincare', 7500, 7500, '20270315', 230, 'https://via.placeholder.com/300x300?text=star%20mist', 'star mist', true, false, false, true),
  ('sevhnii mist 2toi', NULL, 'skincare', 17500, 17500, '35000', 122, 'https://via.placeholder.com/300x300?text=sevhnii%20mist%202toi', 'sevhnii mist 2toi', true, false, false, true),
  ('star set', NULL, 'skincare', 27900, 27900, '8809460321821', 150, 'https://via.placeholder.com/300x300?text=star%20set', 'star set', true, false, false, true),
  ('hvvhdiin sawan costco', 'Costco', 'skincare', 45000, 45000, '8806325630494', 47, 'https://via.placeholder.com/300x300?text=hvvhdiin%20sawan%20costc', 'hvvhdiin sawan costco - Costco', true, false, true, false),
  ('usnii mask', NULL, 'masks', 2500, 2500, '20270621', 127, 'https://via.placeholder.com/300x300?text=usnii%20mask', 'usnii mask', true, false, false, true),
  ('celeste retinal mask', NULL, 'masks', 1500, 1500, '8809803051668', 1133, 'https://via.placeholder.com/300x300?text=celeste%20retinal%20mask', 'celeste retinal mask', true, false, false, true),
  ('whisish muugtei mask', NULL, 'masks', 1000, 1000, '8809951050452', 3000, 'https://via.placeholder.com/300x300?text=whisish%20muugtei%20mask', 'whisish muugtei mask', true, false, false, true),
  ('Minou pad', NULL, 'skincare', 11000, 11000, '20280628', 100, 'https://via.placeholder.com/300x300?text=Minou%20pad', 'Minou pad', true, false, false, true),
  ('toson tseverlegc tsenher micro', NULL, 'skincare', 10000, 10000, '20280118', 103, 'https://via.placeholder.com/300x300?text=toson%20tseverlegc%20tse', 'toson tseverlegc tsenher micro', true, false, false, true),
  ('Body wash jeju', NULL, 'body', 10000, 10000, '8809794732096', 388, 'https://via.placeholder.com/300x300?text=Body%20wash%20jeju', 'Body wash jeju', true, false, false, true),
  ('jm cica mask nogoon savtai', 'JM', 'skincare', 13000, 16000, '8809794736506', 151, 'https://via.placeholder.com/300x300?text=jm%20cica%20mask%20nogoon%20', 'jm cica mask nogoon savtai - JM', true, false, false, true),
  ('Relax jelly nogoon', NULL, 'skincare', 16500, 16500, '8809495078103', 454, 'https://via.placeholder.com/300x300?text=Relax%20jelly%20nogoon', 'Relax jelly nogoon', true, false, false, true),
  ('Whoo kom', NULL, 'skincare', 135900, 135900, '8801051745979', 31, 'https://via.placeholder.com/300x300?text=Whoo%20kom', 'Whoo kom', true, false, true, false),
  ('kamil', NULL, 'skincare', 6000, 6000, '4000196936561', 1011, 'https://via.placeholder.com/300x300?text=kamil', 'kamil', true, false, false, true),
  ('PDRN pad', NULL, 'skincare', 19000, 19000, '8809803051378', 634, 'https://via.placeholder.com/300x300?text=PDRN%20pad', 'PDRN pad', true, false, false, true),
  ('sun patch franz', NULL, 'suncare', 7900, 7900, '8809523403075', 201, 'https://via.placeholder.com/300x300?text=sun%20patch%20franz', 'sun patch franz', true, false, false, true),
  ('zovhinii tos nogoon prettyskin', NULL, 'skincare', 13000, 13000, '8809733216090', 1179, 'https://via.placeholder.com/300x300?text=zovhinii%20tos%20nogoon%20', 'zovhinii tos nogoon prettyskin', true, false, false, true),
  ('medilab nogoon', NULL, 'skincare', 750, 750, '8809082377107', 4030, 'https://via.placeholder.com/300x300?text=medilab%20nogoon', 'medilab nogoon', true, false, false, true),
  ('almond', NULL, 'skincare', 55000, 55000, '096619995530', 18, 'https://via.placeholder.com/300x300?text=almond', 'almond', true, false, true, false),
  ('Narnii tos tone up', NULL, 'skincare', 7500, 7500, '8809800464553', 523, 'https://via.placeholder.com/300x300?text=Narnii%20tos%20tone%20up', 'Narnii tos tone up', true, false, false, true),
  ('toson tseverlegc vivlas', NULL, 'skincare', 5000, 5000, '8809511533388', 188, 'https://via.placeholder.com/300x300?text=toson%20tseverlegc%20viv', 'toson tseverlegc vivlas', true, false, false, true),
  ('Tsenher jijig pad', NULL, 'skincare', 500, 500, '8809290581396', 3318, 'https://via.placeholder.com/300x300?text=Tsenher%20jijig%20pad', 'Tsenher jijig pad', true, false, false, true),
  ('bubble pad nogoon', NULL, 'skincare', 500, 500, '8809435405846', 2870, 'https://via.placeholder.com/300x300?text=bubble%20pad%20nogoon', 'bubble pad nogoon', true, false, false, true),
  ('jmella usan tseverlegch', 'JM', 'skincare', 15000, 15000, '8809711718967', 60, 'https://via.placeholder.com/300x300?text=jmella%20usan%20tseverle', 'jmella usan tseverlegch - JM', true, false, false, true),
  ('rucir care set kom', NULL, 'skincare', 55000, 55000, '8807788640013', 15, 'https://via.placeholder.com/300x300?text=rucir%20care%20set%20kom', 'rucir care set kom', true, false, true, false),
  ('Tsagaan svvn toner', NULL, 'skincare', 5000, 9900, '20260116', 63, 'https://via.placeholder.com/300x300?text=Tsagaan%20svvn%20toner', 'Tsagaan svvn toner', true, false, false, true),
  ('zuurdag mask rose', NULL, 'masks', 9000, 9000, '8809534613043', 191, 'https://via.placeholder.com/300x300?text=zuurdag%20mask%20rose', 'zuurdag mask rose', true, false, false, true),
  ('kashlok', NULL, 'skincare', 3500, 3500, '111111', 645, 'https://via.placeholder.com/300x300?text=kashlok', 'kashlok', true, false, false, true),
  ('alttai essence', NULL, 'skincare', 35000, 35000, '8809534250927', 116, 'https://via.placeholder.com/300x300?text=alttai%20essence', 'alttai essence', true, false, true, true),
  ('nuurnii hoos green toks', NULL, 'skincare', 15000, 15000, '8809555250999', 67, 'https://via.placeholder.com/300x300?text=nuurnii%20hoos%20green%20t', 'nuurnii hoos green toks', true, false, false, true),
  ('Huluunii tsutan', NULL, 'skincare', 19000, 19000, '8809651292312', 42, 'https://via.placeholder.com/300x300?text=Huluunii%20tsutan', 'Huluunii tsutan', true, false, false, false),
  ('pdrn ygaan collagen 20sh', NULL, 'skincare', 15000, 15000, '8800260612966', 756, 'https://via.placeholder.com/300x300?text=pdrn%20ygaan%20collagen%20', 'pdrn ygaan collagen 20sh', true, false, false, true),
  ('uruul hureelegc', NULL, 'skincare', 2500, 2500, '8809485972367', 46, 'https://via.placeholder.com/300x300?text=uruul%20hureelegc', 'uruul hureelegc', true, false, false, false),
  ('uusdag hoos', NULL, 'skincare', 750, 1500, '8809339905923', 1020, 'https://via.placeholder.com/300x300?text=uusdag%20hoos', 'uusdag hoos', true, false, false, true),
  ('4b foundation', NULL, 'makeup', 17500, 17500, '20270420', 335, 'https://via.placeholder.com/300x300?text=4b%20foundation', '4b foundation', true, false, false, true),
  ('Narnii balm medipeel', 'Medipeel', 'skincare', 9500, 9500, '8809409340791', 1071, 'https://via.placeholder.com/300x300?text=Narnii%20balm%20medipeel', 'Narnii balm medipeel - Medipeel', true, false, false, true),
  ('skinfood teatree', 'Skinfood', 'skincare', 10000, 10000, '20270325', 702, 'https://via.placeholder.com/300x300?text=skinfood%20teatree', 'skinfood teatree - Skinfood', true, false, false, true),
  ('glow krem', NULL, 'makeup', 9900, 9900, '8809084080142', 0, 'https://via.placeholder.com/300x300?text=glow%20krem', 'glow krem', false, false, false, false),
  ('cushn zapas', NULL, 'makeup', 5000, 5000, '8809499085763', 0, 'https://via.placeholder.com/300x300?text=cushn%20zapas', 'cushn zapas', false, false, false, false),
  ('Green tea vnerten', NULL, 'fragrance', 45000, 45000, '085805268848', 4, 'https://via.placeholder.com/300x300?text=Green%20tea%20vnerten', 'Green tea vnerten', true, false, false, false),
  ('mangas mask', NULL, 'masks', 500, 500, '20251102', 496, 'https://via.placeholder.com/300x300?text=mangas%20mask', 'mangas mask', true, false, false, true),
  ('tos W.lab', NULL, 'skincare', 5000, 5000, '8809483669627', 192, 'https://via.placeholder.com/300x300?text=tos%20W.lab', 'tos W.lab', true, false, false, true),
  ('sleep W.lab', NULL, 'skincare', 5000, 5000, '8809483669245', 114, 'https://via.placeholder.com/300x300?text=sleep%20W.lab', 'sleep W.lab', true, false, false, true),
  ('toner w.lab', NULL, 'skincare', 5000, 5000, '8809483669214', 41, 'https://via.placeholder.com/300x300?text=toner%20w.lab', 'toner w.lab', true, false, false, false),
  ('Turaah naalt', NULL, 'skincare', 1000, 1000, '8809329132360', 183, 'https://via.placeholder.com/300x300?text=Turaah%20naalt', 'Turaah naalt', true, false, false, true),
  ('kundal biyiin tos', NULL, 'body', 2500, 2500, '8809568742122', 24, 'https://via.placeholder.com/300x300?text=kundal%20biyiin%20tos', 'kundal biyiin tos', true, false, false, false),
  ('uruuliin tint', NULL, 'makeup', 5000, 5000, '8809528010049', 73, 'https://via.placeholder.com/300x300?text=uruuliin%20tint', 'uruuliin tint', true, false, false, true),
  ('Kontor 8000', NULL, 'skincare', 8000, 8000, '8809696980663', 123, 'https://via.placeholder.com/300x300?text=Kontor%208000', 'Kontor 8000', true, false, false, true),
  ('karadium kontor', NULL, 'skincare', 16000, 16000, '8809464540297', 69, 'https://via.placeholder.com/300x300?text=karadium%20kontor', 'karadium kontor', true, false, false, true),
  ('Narnii tos mauve', NULL, 'suncare', 7500, 7500, '8809676920016', 4, 'https://via.placeholder.com/300x300?text=Narnii%20tos%20mauve', 'Narnii tos mauve', true, false, false, false),
  ('Jmella nuurnii hoos', 'JM', 'skincare', 15000, 7500, '8809711719315', 16, 'https://via.placeholder.com/300x300?text=Jmella%20nuurnii%20hoos', 'Jmella nuurnii hoos - JM', true, false, false, false),
  ('jmella hoos', 'JM', 'skincare', 7500, 7500, '8809711719292', 0, 'https://via.placeholder.com/300x300?text=jmella%20hoos', 'jmella hoos - JM', false, false, false, false),
  ('jeju suguk sleeping pack', NULL, 'skincare', 17000, 12000, '8809605876230', 7, 'https://via.placeholder.com/300x300?text=jeju%20suguk%20sleeping%20', 'jeju suguk sleeping pack', true, false, false, false),
  ('hoos dear snow kom', NULL, 'skincare', 9900, 9900, '8809824910043', 14, 'https://via.placeholder.com/300x300?text=hoos%20dear%20snow%20kom', 'hoos dear snow kom', true, false, false, false),
  ('essence dear snow kom', NULL, 'skincare', 9900, 9900, '8809824910036', 15, 'https://via.placeholder.com/300x300?text=essence%20dear%20snow%20ko', 'essence dear snow kom', true, false, false, false),
  ('hereglel jm', 'JM', 'skincare', 4500, 4500, '8809505549869', 40, 'https://via.placeholder.com/300x300?text=hereglel%20jm', 'hereglel jm - JM', true, false, false, false),
  ('begok haildag mask', NULL, 'masks', 3000, 3000, '8809421129862', 709, 'https://via.placeholder.com/300x300?text=begok%20haildag%20mask', 'begok haildag mask', true, false, false, true),
  ('Narnii naalt', NULL, 'skincare', 9900, 9900, '8809440683840', 477, 'https://via.placeholder.com/300x300?text=Narnii%20naalt', 'Narnii naalt', true, false, false, true),
  ('dior uruul ungulugch', NULL, 'skincare', 85000, 85000, '85000', 17, 'https://via.placeholder.com/300x300?text=dior%20uruul%20ungulugch', 'dior uruul ungulugch', true, false, true, false),
  ('age r booster', NULL, 'skincare', 550000, 550000, '8800256114481', 2, 'https://via.placeholder.com/300x300?text=age%20r%20booster', 'age r booster', true, false, false, false),
  ('teatree mask', NULL, 'masks', 10000, 16500, '8806173475063', 369, 'https://via.placeholder.com/300x300?text=teatree%20mask', 'teatree mask', true, false, false, true),
  ('Amino kom', NULL, 'skincare', 12500, 12500, '8809483668682', 102, 'https://via.placeholder.com/300x300?text=Amino%20kom', 'Amino kom', true, false, false, true),
  ('luuvantai mask', NULL, 'masks', 500, 500, '8809085105943', 4439, 'https://via.placeholder.com/300x300?text=luuvantai%20mask', 'luuvantai mask', true, false, false, true),
  ('mezclar tos', NULL, 'skincare', 12500, 12500, '8809495898671', 9, 'https://via.placeholder.com/300x300?text=mezclar%20tos', 'mezclar tos', true, false, false, false),
  ('eye cleaner dear snow kom', NULL, 'skincare', 9900, 9900, '8809824910050', 29, 'https://via.placeholder.com/300x300?text=eye%20cleaner%20dear%20sno', 'eye cleaner dear snow kom', true, false, false, false),
  ('Vok Gel kirkland', NULL, 'skincare', 69900, 69900, '196633845719', 16, 'https://via.placeholder.com/300x300?text=Vok%20Gel%20kirkland', 'Vok Gel kirkland', true, false, true, false),
  ('Booster', NULL, 'skincare', 7500, 7500, '8809668708738', 71, 'https://via.placeholder.com/300x300?text=Booster', 'Booster', true, false, false, true),
  ('Emegteichuudiin gel melonbar', NULL, 'skincare', 5000, 5000, '8809738316016', 68, 'https://via.placeholder.com/300x300?text=Emegteichuudiin%20gel%20', 'Emegteichuudiin gel melonbar', true, false, false, true),
  ('emegteichuudiin gel tsenher', NULL, 'skincare', 5000, 5000, '8809738316009', 67, 'https://via.placeholder.com/300x300?text=emegteichuudiin%20gel%20', 'emegteichuudiin gel tsenher', true, false, false, true),
  ('Skinfood toner tea tree', 'Skinfood', 'skincare', 10000, 10000, '20270305', 0, 'https://via.placeholder.com/300x300?text=Skinfood%20toner%20tea%20t', 'Skinfood toner tea tree - Skinfood', false, false, false, false),
  ('Tseverlegc us omicel', NULL, 'skincare', 16000, 15000, '8809600690992', 78, 'https://via.placeholder.com/300x300?text=Tseverlegc%20us%20omicel', 'Tseverlegc us omicel', true, false, false, true),
  ('Medipeel mask', 'Medipeel', 'skincare', 1500, 1500, '8809941822007', 895, 'https://via.placeholder.com/300x300?text=Medipeel%20mask', 'Medipeel mask - Medipeel', true, false, false, true),
  ('uruuliin mask laneige', 'Laneige', 'masks', 3800, 5000, '20280313', 900, 'https://via.placeholder.com/300x300?text=uruuliin%20mask%20laneig', 'uruuliin mask laneige - Laneige', true, false, false, true),
  ('Vitamin shar jelly', NULL, 'supplements', 33000, 16500, '8809495078080', 22, 'https://via.placeholder.com/300x300?text=Vitamin%20shar%20jelly', 'Vitamin shar jelly', true, false, true, false),
  ('bor moogtei mask', NULL, 'masks', 1000, 1000, '8809951050445', 320, 'https://via.placeholder.com/300x300?text=bor%20moogtei%20mask', 'bor moogtei mask', true, false, false, true),
  ('huuhdiin mask tsenher', NULL, 'masks', 1000, 500, '4680030442238', 1478, 'https://via.placeholder.com/300x300?text=huuhdiin%20mask%20tsenhe', 'huuhdiin mask tsenher', true, false, false, true),
  ('budagtai usnii shampoo', NULL, 'hair', 7000, 7000, '20270316', 66, 'https://via.placeholder.com/300x300?text=budagtai%20usnii%20shamp', 'budagtai usnii shampoo', true, false, false, true),
  ('Gariin tos 2toi', NULL, 'body', 5000, 5000, '8809646370285', 120, 'https://via.placeholder.com/300x300?text=Gariin%20tos%202toi', 'Gariin tos 2toi', true, false, false, true),
  ('laneige toson tseverlegch', 'Laneige', 'skincare', 2500, 2500, '20251106', 47, 'https://via.placeholder.com/300x300?text=laneige%20toson%20tsever', 'laneige toson tseverlegch - Laneige', true, false, false, false),
  ('vanila co balm zero', NULL, 'skincare', 2500, 2500, '20251123', 29, 'https://via.placeholder.com/300x300?text=vanila%20co%20balm%20zero', 'vanila co balm zero', true, false, false, false),
  ('Reedle shot', NULL, 'skincare', 55000, 55000, '8803463008987', 26, 'https://via.placeholder.com/300x300?text=Reedle%20shot', 'Reedle shot', true, false, true, false),
  ('parao mask', NULL, 'masks', 1000, 1000, '8809496772987', 8, 'https://via.placeholder.com/300x300?text=parao%20mask', 'parao mask', true, false, false, false),
  ('nuurstei mask', NULL, 'masks', 1000, 1000, '8809478401089', 10, 'https://via.placeholder.com/300x300?text=nuurstei%20mask', 'nuurstei mask', true, false, false, false),
  ('mask sidmool', NULL, 'masks', 1000, 1000, '8809492020426', 32, 'https://via.placeholder.com/300x300?text=mask%20sidmool', 'mask sidmool', true, false, false, false),
  ('GC mask', NULL, 'masks', 750, 750, '8809803051071', 1104, 'https://via.placeholder.com/300x300?text=GC%20mask', 'GC mask', true, false, false, true),
  ('uuttai mask', NULL, 'masks', 500, 500, '8809733217592', 0, 'https://via.placeholder.com/300x300?text=uuttai%20mask', 'uuttai mask', false, false, false, false),
  ('uuttai mask', NULL, 'masks', 500, 500, '8809733214683', 0, 'https://via.placeholder.com/300x300?text=uuttai%20mask', 'uuttai mask', false, false, false, false),
  ('lotion W.lab', NULL, 'skincare', 5000, 5000, '8809483669504', 43, 'https://via.placeholder.com/300x300?text=lotion%20W.lab', 'lotion W.lab', true, false, false, false),
  ('medipeel hoos cica', 'Medipeel', 'skincare', 29900, 26500, '8809409340944', 33, 'https://via.placeholder.com/300x300?text=medipeel%20hoos%20cica', 'medipeel hoos cica - Medipeel', true, false, false, false),
  ('medipeel essence', 'Medipeel', 'skincare', 48000, 48000, '8809941820386', 0, 'https://via.placeholder.com/300x300?text=medipeel%20essence', 'medipeel essence - Medipeel', false, false, false, false),
  ('Jm zowhi mask', 'JM', 'masks', 5000, 5000, '8809711716161', 4, 'https://via.placeholder.com/300x300?text=Jm%20zowhi%20mask', 'Jm zowhi mask - JM', true, false, false, false),
  ('medipeel essence lifting ygaan', 'Medipeel', 'skincare', 48000, 48000, '8809941821802', 227, 'https://via.placeholder.com/300x300?text=medipeel%20essence%20lif', 'medipeel essence lifting ygaan - Medipeel', true, false, true, true),
  ('medipeel essence peptide', 'Medipeel', 'skincare', 48000, 48000, '8809941820416', 0, 'https://via.placeholder.com/300x300?text=medipeel%20essence%20pep', 'medipeel essence peptide - Medipeel', false, false, false, false),
  ('micro patch', NULL, 'skincare', 13500, 13500, '8809458842871', 7, 'https://via.placeholder.com/300x300?text=micro%20patch', 'micro patch', true, false, false, false),
  ('Cetaphil lotion', NULL, 'skincare', 36000, 36000, '3499320013406', 57, 'https://via.placeholder.com/300x300?text=Cetaphil%20lotion', 'Cetaphil lotion', true, false, true, true),
  ('GC mask collagen', NULL, 'masks', 750, 750, '8809803051132', 100, 'https://via.placeholder.com/300x300?text=GC%20mask%20collagen', 'GC mask collagen', true, false, false, true),
  ('GC mask tsenher', NULL, 'masks', 750, 750, '8809803051156', 60, 'https://via.placeholder.com/300x300?text=GC%20mask%20tsenher', 'GC mask tsenher', true, false, false, true),
  ('GC mask vita c', NULL, 'masks', 750, 750, '8809803051095', 200, 'https://via.placeholder.com/300x300?text=GC%20mask%20vita%20c', 'GC mask vita c', true, false, false, true),
  ('jm zogiin baltai mask', 'JM', 'masks', 1500, 1500, '8809505541030', 20, 'https://via.placeholder.com/300x300?text=jm%20zogiin%20baltai%20mas', 'jm zogiin baltai mask - JM', true, false, false, false),
  ('hanbug mask', NULL, 'masks', 1000, 1000, '8809295015988', 47, 'https://via.placeholder.com/300x300?text=hanbug%20mask', 'hanbug mask', true, false, false, false),
  ('Emegteichuudiin hoos nogoon', NULL, 'skincare', 15000, 15000, '8802929009520', 334, 'https://via.placeholder.com/300x300?text=Emegteichuudiin%20hoos', 'Emegteichuudiin hoos nogoon', true, false, false, true),
  ('Emegteichuudiin hoos ygaan', NULL, 'skincare', 15000, 15000, '8802929009537', 47, 'https://via.placeholder.com/300x300?text=Emegteichuudiin%20hoos', 'Emegteichuudiin hoos ygaan', true, false, false, false),
  ('tsenher nabor shig mask', NULL, 'masks', 1000, 1000, '8809462420324', 104, 'https://via.placeholder.com/300x300?text=tsenher%20nabor%20shig%20m', 'tsenher nabor shig mask', true, false, false, true),
  ('bor nabor shig mask', NULL, 'masks', 1000, 1000, '8809462420331', 263, 'https://via.placeholder.com/300x300?text=bor%20nabor%20shig%20mask', 'bor nabor shig mask', true, false, false, true),
  ('Tseverlegch us huh', NULL, 'skincare', 10000, 10000, '20271022', 167, 'https://via.placeholder.com/300x300?text=Tseverlegch%20us%20huh', 'Tseverlegch us huh', true, false, false, true),
  ('medipeel choco mask zuurdag', 'Medipeel', 'masks', 4000, 4000, '8809409342542', 2, 'https://via.placeholder.com/300x300?text=medipeel%20choco%20mask%20', 'medipeel choco mask zuurdag - Medipeel', true, false, false, false),
  ('Jm solution wormwood mask', 'JM', 'masks', 1500, 1500, '8809711715263', 841, 'https://via.placeholder.com/300x300?text=Jm%20solution%20wormwood', 'Jm solution wormwood mask - JM', true, false, false, true),
  ('jm solution Teatree mask', 'JM', 'masks', 1500, 1500, '8809711715287', 310, 'https://via.placeholder.com/300x300?text=jm%20solution%20Teatree%20', 'jm solution Teatree mask - JM', true, false, false, true),
  ('teatree mask', NULL, 'masks', 1500, 1500, '8809733218438', 647, 'https://via.placeholder.com/300x300?text=teatree%20mask', 'teatree mask', true, false, false, true),
  ('Biy ugaagc beelii', NULL, 'skincare', 2500, 1250, '8809482770799', 414, 'https://via.placeholder.com/300x300?text=Biy%20ugaagc%20beelii', 'Biy ugaagc beelii', true, false, false, true),
  ('JM 3 alhamt mask', 'JM', 'masks', 1500, 1500, '8809505541757', 645, 'https://via.placeholder.com/300x300?text=JM%203%20alhamt%20mask', 'JM 3 alhamt mask - JM', true, false, false, true),
  ('jayjun biyiin set', NULL, 'body', 20000, 20000, '8809495898503', 3, 'https://via.placeholder.com/300x300?text=jayjun%20biyiin%20set', 'jayjun biyiin set', true, false, false, false),
  ('jm alttai mask', 'JM', 'masks', 1500, 1500, '8809505543973', 268, 'https://via.placeholder.com/300x300?text=jm%20alttai%20mask', 'jm alttai mask - JM', true, false, false, true),
  ('jm amino acid savtai mask', 'JM', 'masks', 13000, 16000, '8809794736452', 21, 'https://via.placeholder.com/300x300?text=jm%20amino%20acid%20savtai', 'jm amino acid savtai mask - JM', true, false, false, false),
  ('jm nmf savtai mask', 'JM', 'masks', 13000, 16000, '8809794736339', 38, 'https://via.placeholder.com/300x300?text=jm%20nmf%20savtai%20mask', 'jm nmf savtai mask - JM', true, false, false, false),
  ('jm hyalluronic savtai mask', 'JM', 'masks', 13000, 16000, '8809794736230', 22, 'https://via.placeholder.com/300x300?text=jm%20hyalluronic%20savta', 'jm hyalluronic savtai mask - JM', true, false, false, false),
  ('jm retinol savtai mask', 'JM', 'skincare', 13000, 16000, '8809794736322', 26, 'https://via.placeholder.com/300x300?text=jm%20retinol%20savtai%20ma', 'jm retinol savtai mask - JM', true, false, false, false),
  ('huuldag collagen mask', NULL, 'skincare', 15000, 15000, '8809192706361', 26, 'https://via.placeholder.com/300x300?text=huuldag%20collagen%20mas', 'huuldag collagen mask', true, false, false, false),
  ('dior cushion 4ml', NULL, 'makeup', 17900, 17900, '3348901368568', 23, 'https://via.placeholder.com/300x300?text=dior%20cushion%204ml', 'dior cushion 4ml', true, false, false, false),
  ('tsenher tos', NULL, 'skincare', 7500, 7500, '8809383948914', 32, 'https://via.placeholder.com/300x300?text=tsenher%20tos', 'tsenher tos', true, true, false, false),
  ('tirko', NULL, 'household', 5000, 5000, '8804012161306', 28, 'https://via.placeholder.com/300x300?text=tirko', 'tirko', true, true, false, false),
  ('bor kontor', NULL, 'skincare', 5000, 5000, '8809380660604', 46, 'https://via.placeholder.com/300x300?text=bor%20kontor', 'bor kontor', true, true, false, false),
  ('perwoll vok har huvtsas', 'VT', 'household', 36500, 36500, '8809878063504', 1, 'https://via.placeholder.com/300x300?text=perwoll%20vok%20har%20huvt', 'perwoll vok har huvtsas - VT', true, true, false, false),
  ('ampoule deeom', NULL, 'skincare', 7000, 7000, '8809511536587', 42, 'https://via.placeholder.com/300x300?text=ampoule%20deeom', 'ampoule deeom', true, true, false, false),
  ('humsugnii harandaa', NULL, 'skincare', 2500, 2500, '8809485972374', 9, 'https://via.placeholder.com/300x300?text=humsugnii%20harandaa', 'humsugnii harandaa', true, true, false, false),
  ('ugj essence', NULL, 'skincare', 20000, 20000, '8809525240326', 1, 'https://via.placeholder.com/300x300?text=ugj%20essence', 'ugj essence', true, true, false, false),
  ('medipeel ampoule', 'Medipeel', 'skincare', 32000, 32000, '8809941820621', 33, 'https://via.placeholder.com/300x300?text=medipeel%20ampoule', 'medipeel ampoule - Medipeel', true, true, true, false),
  ('medipeel zovhinii tos', 'Medipeel', 'skincare', 27900, 27900, '8809409340319', 200, 'https://via.placeholder.com/300x300?text=medipeel%20zovhinii%20to', 'medipeel zovhinii tos - Medipeel', true, true, false, true),
  ('kahi balm', NULL, 'skincare', 5000, 5000, '8809738603536', 95, 'https://via.placeholder.com/300x300?text=kahi%20balm', 'kahi balm', true, true, false, true),
  ('Uusdag collagen zovhinii', NULL, 'skincare', 2500, 2500, '8809780290142', 49, 'https://via.placeholder.com/300x300?text=Uusdag%20collagen%20zovh', 'Uusdag collagen zovhinii', true, true, false, false),
  ('vok percil', NULL, 'household', 90000, 90000, '8809401606895', 5, 'https://via.placeholder.com/300x300?text=vok%20percil', 'vok percil', true, true, false, false),
  ('uudel estei mist', NULL, 'skincare', 15000, 15000, '8809379481463', 6, 'https://via.placeholder.com/300x300?text=uudel%20estei%20mist', 'uudel estei mist', true, true, false, false),
  ('Dr young mist', NULL, 'skincare', 5000, 7000, '8809249511238', 111, 'https://via.placeholder.com/300x300?text=Dr%20young%20mist', 'Dr young mist', true, true, false, true),
  ('hamriin mask', NULL, 'masks', 1000, 1000, '8809435910050', 300, 'https://via.placeholder.com/300x300?text=hamriin%20mask', 'hamriin mask', true, true, false, true),
  ('Cream mist rucir', NULL, 'accessories', 13750, 13750, '8809635721210', 69, 'https://via.placeholder.com/300x300?text=Cream%20mist%20rucir', 'Cream mist rucir', true, true, false, true),
  ('Serum rucir', NULL, 'accessories', 13750, 13750, '8807788630014', 101, 'https://via.placeholder.com/300x300?text=Serum%20rucir', 'Serum rucir', true, true, false, true),
  ('Oil mist Rucir', NULL, 'skincare', 13750, 13750, '8809635721227', 223, 'https://via.placeholder.com/300x300?text=Oil%20mist%20Rucir', 'Oil mist Rucir', true, true, false, true),
  ('shampoo Dehaze', NULL, 'skincare', 10000, 10000, '8809754073269', 2, 'https://via.placeholder.com/300x300?text=shampoo%20Dehaze', 'shampoo Dehaze', true, true, false, false),
  ('Boolt', NULL, 'skincare', 2000, 2000, '20002000', 91, 'https://via.placeholder.com/300x300?text=Boolt', 'Boolt', true, true, false, true),
  ('Emegteichuudiin gel Dr carina', NULL, 'skincare', 5000, 5000, '8809483051569', 15, 'https://via.placeholder.com/300x300?text=Emegteichuudiin%20gel%20', 'Emegteichuudiin gel Dr carina', true, true, false, false),
  ('Tonymoly mask', NULL, 'masks', 1500, 1500, '8806194022895', 38, 'https://via.placeholder.com/300x300?text=Tonymoly%20mask', 'Tonymoly mask', true, true, false, false),
  ('Teatree tseverlegc pad', NULL, 'body', 20000, 20000, '8809446655308', 7, 'https://via.placeholder.com/300x300?text=Teatree%20tseverlegc%20p', 'Teatree tseverlegc pad', true, true, false, false),
  ('Lactofit 200sh', NULL, 'household', 95000, 90000, '8805915681410', 1, 'https://via.placeholder.com/300x300?text=Lactofit%20200sh', 'Lactofit 200sh', true, true, false, false),
  ('Budag arilgagch salpetik', NULL, 'body', 2500, 2500, '3760100682830', 38, 'https://via.placeholder.com/300x300?text=Budag%20arilgagch%20salp', 'Budag arilgagch salpetik', true, true, false, false),
  ('Shavran mask S miracle', NULL, 'skincare', 5000, 5000, '15443706', 16, 'https://via.placeholder.com/300x300?text=Shavran%20mask%20S%20mirac', 'Shavran mask S miracle', true, true, false, false),
  ('glenda', NULL, 'skincare', 2500, 2500, '8809657128523', 52, 'https://via.placeholder.com/300x300?text=glenda', 'glenda', true, true, false, true),
  ('marry me unertei us tom', NULL, 'fragrance', 145000, 145000, '3386460023337', 25, 'https://via.placeholder.com/300x300?text=marry%20me%20unertei%20us%20', 'marry me unertei us tom', true, true, true, false),
  ('Shampoo jeju 500ml', NULL, 'skincare', 10000, 10000, '8809710135222', 15, 'https://via.placeholder.com/300x300?text=Shampoo%20jeju%20500ml', 'Shampoo jeju 500ml', true, true, false, false),
  ('Huh vitamin D', NULL, 'household', 5000, 7900, '8809900130198', 32, 'https://via.placeholder.com/300x300?text=Huh%20vitamin%20D', 'Huh vitamin D', true, true, false, false),
  ('VDL primer', NULL, 'makeup', 20000, 20000, '8801051355819', 34, 'https://via.placeholder.com/300x300?text=VDL%20primer', 'VDL primer', true, true, false, false),
  ('SG6 nil ygaan kom', NULL, 'accessories', 99000, 99000, '8809923900006', 7, 'https://via.placeholder.com/300x300?text=SG6%20nil%20ygaan%20kom', 'SG6 nil ygaan kom', true, true, false, false),
  ('Ulaan zapas cushion', NULL, 'makeup', 5000, 5000, NULL, 51, 'https://via.placeholder.com/300x300?text=Ulaan%20zapas%20cushion', 'Ulaan zapas cushion', true, true, false, true),
  ('Chocho lab cushion', NULL, 'makeup', 5000, 12000, '8809499086432', 98, 'https://via.placeholder.com/300x300?text=Chocho%20lab%20cushion', 'Chocho lab cushion', true, true, false, true),
  ('melanon x сэвхний тос', NULL, 'skincare', 27900, 27900, '8809409342566', 2, 'https://via.placeholder.com/300x300?text=melanon%20x%20%D1%81%D1%8D%D0%B2%D1%85%D0%BD%D0%B8%D0%B9%20%D1%82%D0%BE', 'melanon x сэвхний тос', true, true, false, false),
  ('YLS serum', NULL, 'skincare', 10000, 10000, '854613005705', 20, 'https://via.placeholder.com/300x300?text=YLS%20serum', 'YLS serum', true, true, false, false),
  ('Gabrielle untlagiin mask', NULL, 'masks', 40000, 40000, '3541680011926', 13, 'https://via.placeholder.com/300x300?text=Gabrielle%20untlagiin%20', 'Gabrielle untlagiin mask', true, true, true, false),
  ('Turaah vnertei us', NULL, 'fragrance', 40000, 40000, '8809990612819', 16, 'https://via.placeholder.com/300x300?text=Turaah%20vnertei%20us', 'Turaah vnertei us', true, true, true, false),
  ('dotuur huwtsas vnerten', NULL, 'fragrance', 7500, 7500, '8809680170063', 44, 'https://via.placeholder.com/300x300?text=dotuur%20huwtsas%20vnert', 'dotuur huwtsas vnerten', true, true, false, false),
  ('JM krem', 'JM', 'makeup', 12500, 12500, '8809562560487', 56, 'https://via.placeholder.com/300x300?text=JM%20krem', 'JM krem - JM', true, true, false, true),
  ('glow krem', NULL, 'makeup', 9900, 9900, NULL, 4, 'https://via.placeholder.com/300x300?text=glow%20krem', 'glow krem', true, true, false, false),
  ('har peptide', NULL, 'skincare', 19900, 19900, '8809426959631', 3, 'https://via.placeholder.com/300x300?text=har%20peptide', 'har peptide', true, true, false, false),
  ('jkona foundation', NULL, 'makeup', 20000, 20000, '8809711717168', 6, 'https://via.placeholder.com/300x300?text=jkona%20foundation', 'jkona foundation', true, true, false, false),
  ('har cushion kiss', NULL, 'makeup', 2500, 2500, '731509682595', 76, 'https://via.placeholder.com/300x300?text=har%20cushion%20kiss', 'har cushion kiss', true, true, false, true),
  ('4B cushion', NULL, 'makeup', 18000, 18000, '8809857460294', 89, 'https://via.placeholder.com/300x300?text=4B%20cushion', '4B cushion', true, true, false, true),
  ('energy cream', NULL, 'skincare', 9900, 9900, '8809524363217', 23, 'https://via.placeholder.com/300x300?text=energy%20cream', 'energy cream', true, true, false, false),
  ('sniekers', NULL, 'skincare', 80000, 80000, '8804973131448', 3, 'https://via.placeholder.com/300x300?text=sniekers', 'sniekers', true, true, false, false),
  ('tiger toner500ml', NULL, 'skincare', 20000, 15000, '8809663572792', 18, 'https://via.placeholder.com/300x300?text=tiger%20toner500ml', 'tiger toner500ml', true, true, false, false),
  ('bieiin set costco', 'Costco', 'skincare', 65500, 65500, '8801046436424', 7, 'https://via.placeholder.com/300x300?text=bieiin%20set%20costco', 'bieiin set costco - Costco', true, true, false, false)
ON CONFLICT DO NOTHING;

-- =============================================
-- Summary
-- =============================================
-- Imported: 457 products
-- Skipped: 1 (empty name or zero price)
