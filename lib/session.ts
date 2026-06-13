import { cookies } from 'next/headers'
import { SESSION_COOKIE, verifySession, type SessionPayload } from '@/lib/auth'

/** Đọc phiên đăng nhập hiện tại từ cookie (dùng trong Server Component / Route Handler). */
export async function getCurrentUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  return verifySession(token)
}
