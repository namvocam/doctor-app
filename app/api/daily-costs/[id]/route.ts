import { NextResponse, type NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import DailyCostModel from '@/models/DailyCost'
import { getCurrentUser } from '@/lib/session'
import { canManageCosts } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// Xóa 1 bản ghi chi phí - chỉ admin & kế toán.
export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getCurrentUser()
    if (!me) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    if (!canManageCosts(me.role)) {
      return NextResponse.json({ error: 'Bạn không có quyền thực hiện' }, { status: 403 })
    }

    const { id } = await ctx.params
    await connectToDatabase()
    const deleted = await DailyCostModel.findByIdAndDelete(id).lean()
    if (!deleted) {
      return NextResponse.json({ error: 'Không tìm thấy bản ghi' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/daily-costs/[id] error:', error)
    return NextResponse.json({ error: 'Không thể xóa chi phí' }, { status: 400 })
  }
}
