import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/contexts/CartContext'
import { StoreSettingsProvider } from '@/contexts/StoreSettingsContext'
import { AuthProvider } from '@/lib/providers/AuthProvider'
import { Toaster } from 'react-hot-toast'
import { SpeedInsights } from '@vercel/speed-insights/next'

const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'K Beauty - Солонгос Гоо Сайхны Бүтээгдэхүүн',
  description: 'Гоо сайхны шилдэг бүтээгдэхүүн',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <body className={plusJakarta.className}>
        <AuthProvider>
          <StoreSettingsProvider>
            <CartProvider>
              {children}
              <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
              <SpeedInsights />
            </CartProvider>
          </StoreSettingsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
