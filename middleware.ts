import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_ROLES = ['owner', 'admin', 'manager', 'support']

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    return res
  }
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string }[]) {
        cookiesToSet.forEach(({ name, value }) => res.cookies.set(name, value))
      },
    },
  })
  const path = request.nextUrl.pathname

  if (path.startsWith('/admin') || path.startsWith('/account')) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const login = new URL('/login', request.url)
      login.searchParams.set('next', path)
      const redirectRes = NextResponse.redirect(login)
      res.cookies.getAll().forEach((c) => redirectRes.cookies.set(c.name, c.value))
      return redirectRes
    }
    // Admin routes: only owner, admin, manager, support may access
    if (path.startsWith('/admin')) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      const isAdmin = !profileError && profile?.role && ADMIN_ROLES.includes(profile.role)
      if (!isAdmin) {
        const redirectRes = NextResponse.redirect(new URL('/', request.url))
        res.cookies.getAll().forEach((c) => redirectRes.cookies.set(c.name, c.value))
        return redirectRes
      }
    }
  }

  return res
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/account', '/account/:path*'],
}
