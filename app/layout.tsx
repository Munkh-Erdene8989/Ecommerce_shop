import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/contexts/CartContext'
import { AuthProvider } from '@/lib/providers/AuthProvider'
import { QueryProvider } from '@/lib/providers/QueryProvider'
import { Toaster } from 'react-hot-toast'

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
        <QueryProvider>
          <AuthProvider>
            <CartProvider>
              {children}
              <Toaster
                position="top-center"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: '#333',
                    color: '#fff',
                  },
                }}
              />
            </CartProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
