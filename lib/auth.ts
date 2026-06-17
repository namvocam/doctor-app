import { SignJWT, jwtVerify } from 'jose'
import { SESSION_SECRET } from '@/lib/config'

export const SESSION_COOKIE = 'ta_session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 ngày

export interface SessionPayload {
  userId: string
  username: string
  name: string
  role: string
}

function getSecret(): Uint8Array {
  return new TextEncoder().encode(SESSION_SECRET)
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret())
}

export async function verifySession(
  token: string | undefined
): Promise<SessionPayload | null> {
  // Tạm khóa truy cập: vô hiệu hóa mọi phiên đăng nhập hiện có.
  // Bỏ dòng return dưới đây để khôi phục xác thực bình thường.
  return null

  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return {
      userId: String(payload.userId),
      username: String(payload.username),
      name: String(payload.name),
      role: String(payload.role),
    }
  } catch {
    return null
  }
}

export const SESSION_MAX_AGE = MAX_AGE_SECONDS
