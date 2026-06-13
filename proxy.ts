import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/auth'

const PUBLIC_PATHS = ['/login']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(SESSION_COOKIE)?.value
  const session = await verifySession(token)

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  // Đã đăng nhập mà vào /login → đưa về dashboard
  if (session && isPublic) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Chưa đăng nhập mà vào trang được bảo vệ → đưa về /login
  if (!session && !isPublic) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Bỏ qua API, file tĩnh, ảnh, favicon và các file public
    '/((?!api|_next/static|_next/image|favicon.ico|logo.svg|next.svg|vercel.svg).*)',
  ],
}
