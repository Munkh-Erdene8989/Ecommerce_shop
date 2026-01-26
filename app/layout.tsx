import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/contexts/CartContext'

export const metadata: Metadata = {
  title: 'AZ Beauty - Солонгос Гоо Сайхны Бүтээгдэхүүн',
  description: 'Солонгос гоо сайхны шилдэг бүтээгдэхүүнийг танд хүргэж байна',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="mn">
      <body>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  )
}
