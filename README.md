# AZ Beauty - Солонгос Гоо Сайхны E-commerce Вэбсайт

Next.js ашиглан бүтээсэн солонгос гоо сайхны бүтээгдэхүүний онлайн дэлгүүр.

## Онцлог

- ✅ Next.js 14 (App Router)
- ✅ React 18
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ Context API (Cart Management)
- ✅ Responsive Design
- ✅ LocalStorage (Cart persistence)

## Суулгах

```bash
# Dependencies суулгах
npm install

# Development server эхлүүлэх
npm run dev

# Production build
npm run build
npm start
```

## Хуудсууд

- `/` - Нүүр хуудас
- `/products` - Бүтээгдэхүүний жагсаалт
- `/products/[id]` - Бүтээгдэхүүний дэлгэрэнгүй
- `/cart` - Сагс
- `/checkout` - Захиалга хийх
- `/order-success` - Захиалгын амжилттай хуудас

## Бүтэц

```
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── products/          # Products pages
│   ├── cart/              # Cart page
│   ├── checkout/          # Checkout page
│   └── order-success/     # Success page
├── components/            # React components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── ProductCard.tsx
│   └── ...
├── contexts/              # React Context
│   └── CartContext.tsx
├── lib/                   # Utilities
│   └── products.ts
└── public/                # Static files
```

## Технологи

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Storage**: LocalStorage

## Хөгжүүлэлт

Вэбсайт нь дараах функцүүдийг агуулна:

- Бүтээгдэхүүний жагсаалт, шүүлт, эрэмбэлэлт
- Бүтээгдэхүүний дэлгэрэнгүй мэдээлэл
- Сагсны удирдлага
- Захиалга хийх систем
- Төлбөрийн арга сонгох
- Хүргэлтийн тооцоолол

## Лиценз

MIT
