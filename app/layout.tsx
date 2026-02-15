import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/contexts/CartContext'
import { AuthProvider } from '@/lib/providers/AuthProvider'
import { ApolloProvider } from '@/lib/providers/ApolloProvider'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'AZ Beauty - Солонгос Гоо Сайхны Бүтээгдэхүүн',
  description: 'Солонгос гоо сайхны шилдэг бүтээгдэхүүн',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <body>
        <AuthProvider>
          <ApolloProvider>
            <CartProvider>
              {children}
              <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
            </CartProvider>
          </ApolloProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
