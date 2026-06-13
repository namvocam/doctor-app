import { NextResponse, type NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectToDatabase } from '@/lib/mongodb'
import UserModel from '@/models/User'
import { getCurrentUser } from '@/lib/session'
import { ROLES } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export async function GET() {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
  if (me.role !== 'admin') return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })

  await connectToDatabase()
  const users = await UserModel.find({}, 'username name role status createdAt').sort({ createdAt: -1 }).lean()
  return NextResponse.json({
    data: users.map((u) => ({
      _id: String(u._id),
      username: u.username,
      name: u.name,
      role: u.role,
      status: u.status ?? 'active',
    })),
  })
}

export async function POST(request: NextRequest) {
  try {
    const me = await getCurrentUser()
    if (!me) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    if (me.role !== 'admin') return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })

    const { username, name, role, password } = await request.json()
    if (!username?.trim() || !name?.trim() || !role || !password) {
      return NextResponse.json({ error: 'Vui lòng nhập đủ thông tin' }, { status: 400 })
    }
    if (!ROLES.includes(role)) {
      return NextResponse.json({ error: 'Vai trò không hợp lệ' }, { status: 400 })
    }
    if (String(password).length < 4) {
      return NextResponse.json({ error: 'Mật khẩu tối thiểu 4 ký tự' }, { status: 400 })
    }

    await connectToDatabase()
    const existed = await UserModel.findOne({ username: username.trim() })
    if (existed) {
      return NextResponse.json({ error: 'Tên đăng nhập đã tồn tại' }, { status: 409 })
    }

    const user = await UserModel.create({
      username: username.trim(),
      name: name.trim(),
      role,
      passwordHash: await bcrypt.hash(password, 10),
    })
    return NextResponse.json(
      { data: { _id: String(user._id), username: user.username, name: user.name, role: user.role } },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/users error:', error)
    return NextResponse.json({ error: 'Không thể tạo tài khoản' }, { status: 400 })
  }
}
