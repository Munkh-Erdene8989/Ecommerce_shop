-- AZ Beauty - Seed data
-- Run: supabase db execute -f supabase/seed.sql (or via Dashboard SQL Editor)

-- Categories
INSERT INTO public.categories (id, name, slug) VALUES
  (uuid_generate_v4(), 'Арьс арчилгаа', 'skincare'),
  (uuid_generate_v4(), 'Нүүрний будаг', 'makeup'),
  (uuid_generate_v4(), 'Үсний бүтээгдэхүүн', 'hair'),
  (uuid_generate_v4(), 'Маск', 'masks'),
  (uuid_generate_v4(), 'Нарнаас хамгаалах', 'suncare')
ON CONFLICT (slug) DO NOTHING;

-- Brands
INSERT INTO public.brands (id, name, slug) VALUES
  (uuid_generate_v4(), 'Laneige', 'laneige'),
  (uuid_generate_v4(), 'Innisfree', 'innisfree'),
  (uuid_generate_v4(), 'COSRX', 'cosrx'),
  (uuid_generate_v4(), 'Etude House', 'etude-house')
ON CONFLICT (slug) DO NOTHING;

-- Sample products (with slug)
INSERT INTO public.products (
  id, name, slug, brand, category, price, original_price, stock_quantity,
  image, description, in_stock, skin_type, benefits, is_featured, is_new, is_bestseller
) VALUES
  (
    uuid_generate_v4(),
    'Laneige Water Sleeping Mask',
    'laneige-water-sleeping-mask',
    'Laneige',
    'skincare',
    85000,
    95000,
    50,
    'https://via.placeholder.com/300x300?text=Laneige+Mask',
    'Шөнийн усан маск - арьсыг чийгшүүлнэ.',
    true,
    ARRAY['normal', 'dry'],
    ARRAY['чийгшүүлэгч', 'сэргээгч'],
    true,
    true,
    true
  ),
  (
    uuid_generate_v4(),
    'COSRX Advanced Snail 96 Mucin',
    'cosrx-advanced-snail-96-mucin',
    'COSRX',
    'skincare',
    45000,
    NULL,
    100,
    'https://via.placeholder.com/300x300?text=COSRX+Snail',
    'Сармагчин эсиййн essence - арьсыг эрүүлжүүлнэ.',
    true,
    ARRAY['all'],
    ARRAY['сэргээгч', 'тугалмал'],
    true,
    false,
    true
  ),
  (
    uuid_generate_v4(),
    'Innisfree Green Tea Seed Serum',
    'innisfree-green-tea-seed-serum',
    'Innisfree',
    'skincare',
    65000,
    72000,
    80,
    'https://via.placeholder.com/300x300?text=Innisfree+Serum',
    'Ногоон цайны үрийн serum - чийгшүүлэгч.',
    true,
    ARRAY['normal', 'dry', 'oily'],
    ARRAY['чийгшүүлэгч', 'антиоксидант'],
    true,
    false,
    false
  )
ON CONFLICT (slug) DO NOTHING;

-- Sample coupon
INSERT INTO public.coupons (id, code, type, value, min_order_amount, max_uses, used_count, valid_from, valid_until)
VALUES (
  uuid_generate_v4(),
  'WELCOME10',
  'percent',
  10,
  30000,
  1000,
  0,
  now(),
  now() + interval '1 year'
)
ON CONFLICT (code) DO NOTHING;
