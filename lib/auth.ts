import { SignJWT, jwtVerify } from 'jose'

export const SESSION_COOKIE = 'ta_session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 ngày

export interface SessionPayload {
  userId: string
  username: string
  name: string
  role: string
}

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error('Thiếu biến môi trường SESSION_SECRET')
  }
  return new TextEncoder().encode(secret)
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
