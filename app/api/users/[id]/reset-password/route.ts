import { NextResponse, type NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectToDatabase } from '@/lib/mongodb'
import UserModel from '@/models/User'
import { getCurrentUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getCurrentUser()
    if (!me) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    if (me.role !== 'admin') return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })

    const { id } = await ctx.params
    const { password } = await request.json()
    if (!password || String(password).length < 4) {
      return NextResponse.json({ error: 'Mật khẩu tối thiểu 4 ký tự' }, { status: 400 })
    }

    await connectToDatabase()
    const user = await UserModel.findByIdAndUpdate(id, {
      passwordHash: await bcrypt.hash(password, 10),
    })
    if (!user) return NextResponse.json({ error: 'Không tìm thấy tài khoản' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST reset-password error:', error)
    return NextResponse.json({ error: 'Không thể đặt lại mật khẩu' }, { status: 500 })
  }
}
