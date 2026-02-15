'use client'

import { Suspense, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/'
  const supabase = createClient()

  const handleEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      })
      if (error) throw error
      setOtpSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Алдаа гарлаа')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      })
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Алдаа гарлаа')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm py-4">
        <div className="container">
          <Link href="/" className="text-2xl font-bold text-primary">
            AZ BEAUTY
          </Link>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">Нэвтрэх</h1>

          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
            >
              Google-ээр нэвтрэх
            </button>
            <button
              type="button"
              onClick={() => handleOAuth('facebook')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] font-medium disabled:opacity-50"
            >
              Facebook-ээр нэвтрэх
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <span className="relative flex justify-center text-sm text-gray-500 bg-gray-50 px-2">эсвэл</span>
          </div>

          {otpSent ? (
            <p className="text-green-600 text-center">Имэйл рүү илгээсэн холбоосоор нэвтрэнэ үү.</p>
          ) : (
            <form onSubmit={handleEmailOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Имэйл</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder="email@example.com"
                  required
                />
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50"
              >
                {loading ? 'Илгээж байна...' : 'Имэйлээр нэвтрэх'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/" className="text-primary hover:underline">
              ← Нүүр хуудас
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Ачаалж байна...</div>}>
      <LoginForm />
    </Suspense>
  )
}
