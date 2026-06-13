import { NextResponse, type NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import UserModel from '@/models/User'
import { getCurrentUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

// Khóa/mở khóa tài khoản (cập nhật status) - admin only
export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getCurrentUser()
    if (!me) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    if (me.role !== 'admin') return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })

    const { id } = await ctx.params
    if (id === me.userId) {
      return NextResponse.json({ error: 'Không thể tự khóa tài khoản của mình' }, { status: 400 })
    }
    const { status } = await request.json()
    if (status !== 'active' && status !== 'inactive') {
      return NextResponse.json({ error: 'Trạng thái không hợp lệ' }, { status: 400 })
    }

    await connectToDatabase()
    const user = await UserModel.findByIdAndUpdate(id, { status }, { new: true }).lean()
    if (!user) return NextResponse.json({ error: 'Không tìm thấy tài khoản' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('PATCH /api/users/[id] error:', error)
    return NextResponse.json({ error: 'Không thể cập nhật tài khoản' }, { status: 500 })
  }
}

// Xóa tài khoản - admin only
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getCurrentUser()
    if (!me) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    if (me.role !== 'admin') return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })

    const { id } = await ctx.params
    if (id === me.userId) {
      return NextResponse.json({ error: 'Không thể xóa tài khoản của mình' }, { status: 400 })
    }

    await connectToDatabase()
    const user = await UserModel.findByIdAndDelete(id)
    if (!user) return NextResponse.json({ error: 'Không tìm thấy tài khoản' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/users/[id] error:', error)
    return NextResponse.json({ error: 'Không thể xóa tài khoản' }, { status: 500 })
  }
}
