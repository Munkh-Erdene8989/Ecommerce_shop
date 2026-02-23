'use client'

import { Suspense, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isRegister, setIsRegister] = useState(false)
  const [isResetMode, setIsResetMode] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/'
  const supabase = createClient()

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      router.push(next)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Алдаа гарлаа')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!email) {
      setError('Эхлээд имэйл хаягаа оруулна уу.')
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      })
      if (error) throw error
      setSuccess('Нууц үг сэргээх линк таны имэйл рүү илгээгдлээ.')
      setIsResetMode(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Алдаа гарлаа')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      })
      if (error) throw error
      setSuccess('Бүртгэл үүсгэлээ. Имэйлээ шалгаж баталгаажуулна уу.')
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
          <h1 className="text-2xl font-bold mb-6 text-center">
            {isRegister ? 'Бүртгүүлэх' : isResetMode ? 'Нууц үг сэргээх' : 'Нэвтрэх'}
          </h1>

          <div className="flex justify-center gap-2 mb-4 text-sm">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false)
                setIsResetMode(false)
                setError(null)
                setSuccess(null)
              }}
              className={`px-3 py-1 rounded-full ${
                !isRegister ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Нэвтрэх
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true)
                setIsResetMode(false)
                setError(null)
                setSuccess(null)
              }}
              className={`px-3 py-1 rounded-full ${
                isRegister ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Бүртгүүлэх
            </button>
          </div>

          {success && <div className="mb-4 text-green-600 text-sm text-center">{success}</div>}
          {error && !isRegister && (
            <div className="mb-4 text-red-600 text-sm text-center">{error}</div>
          )}

          {!isRegister && !isResetMode && (
            <>
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

              <form onSubmit={handlePasswordLogin} className="space-y-4">
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
                <div>
                  <label className="block text-sm font-medium mb-1">Нууц үг</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder="••••••••"
                    required
                  />
                </div>
                {error && <div className="text-red-600 text-sm">{error}</div>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50"
                >
                  {loading ? 'Нэвтэрч байна...' : 'Имэйл + нууц үгээр нэвтрэх'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsResetMode(true)
                    setSuccess(null)
                    setError(null)
                  }}
                  className="w-full text-gray-600 text-sm hover:underline"
                >
                  Нууц үгээ мартсан уу?
                </button>
              </form>
            </>
          )}

          {!isRegister && isResetMode && (
            <div className="mt-4 space-y-4">
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
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50"
              >
                {loading ? 'Илгээж байна...' : 'Нууц үг сэргээх линк илгээх'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(false)
                  setError(null)
                  setSuccess(null)
                }}
                className="w-full text-gray-600 text-sm hover:underline"
              >
                Нэвтрэх цонх руу буцах
              </button>
            </div>
          )}

          {isRegister && (
            <form onSubmit={handleRegister} className="space-y-4 mt-4">
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
              <div>
                <label className="block text-sm font-medium mb-1">Нууц үг</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50"
              >
                {loading ? 'Бүртгэж байна...' : 'Бүртгэл үүсгэх'}
              </button>
              <p className="text-xs text-gray-500 text-center">
                Бүртгэл үүсгэсний дараа баталгаажуулах линк таны имэйл рүү илгээгдэнэ.
              </p>
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
