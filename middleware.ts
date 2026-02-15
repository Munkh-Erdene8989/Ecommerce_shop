import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string }[]) {
          cookiesToSet.forEach(({ name, value }) => res.cookies.set(name, value))
        },
      },
    }
  )
  const { data: { session } } = await supabase.auth.getSession()
  const path = request.nextUrl.pathname

  if (path.startsWith('/admin') || path.startsWith('/account')) {
    if (!session) {
      const login = new URL('/login', request.url)
      login.searchParams.set('next', path)
      return NextResponse.redirect(login)
    }
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*'],
}
