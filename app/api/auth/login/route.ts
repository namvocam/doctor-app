import { NextResponse, type NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectToDatabase } from '@/lib/mongodb'
import UserModel from '@/models/User'
import { signSession, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập tên đăng nhập và mật khẩu' },
        { status: 400 }
      )
    }

    await connectToDatabase()
    const user = await UserModel.findOne({ username: username.trim() })

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json(
        { error: 'Tên đăng nhập hoặc mật khẩu không đúng' },
        { status: 401 }
      )
    }

    if (user.status === 'inactive') {
      return NextResponse.json(
        { error: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.' },
        { status: 403 }
      )
    }

    const token = await signSession({
      userId: String(user._id),
      username: user.username,
      name: user.name,
      role: user.role,
    })

    const response = NextResponse.json({
      data: { name: user.name, role: user.role },
    })
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    })
    return response
  } catch (error) {
    console.error('POST /api/auth/login error:', error)
    return NextResponse.json({ error: 'Đã xảy ra lỗi, vui lòng thử lại' }, { status: 500 })
  }
}
