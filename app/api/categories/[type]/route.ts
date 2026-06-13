import { NextResponse, type NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import CategoryModel, { CATEGORY_TYPES, CATEGORY_LABELS, type CategoryType } from '@/models/Category'
import { getCurrentUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

// Cập nhật danh sách option của một danh mục - chỉ admin.
export async function PUT(
  request: NextRequest,
  ctx: { params: Promise<{ type: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Bạn không có quyền thực hiện' }, { status: 403 })
    }

    const { type } = await ctx.params
    if (!CATEGORY_TYPES.includes(type as CategoryType)) {
      return NextResponse.json({ error: 'Loại danh mục không hợp lệ' }, { status: 400 })
    }

    const body = await request.json()
    const options: string[] = Array.isArray(body.options)
      ? body.options.map((o: unknown) => String(o).trim()).filter(Boolean)
      : []

    await connectToDatabase()
    const category = await CategoryModel.findOneAndUpdate(
      { type },
      { type, label: CATEGORY_LABELS[type as CategoryType], options },
      { new: true, upsert: true }
    ).lean()

    return NextResponse.json({ data: category })
  } catch (error) {
    console.error('PUT /api/categories/[type] error:', error)
    return NextResponse.json({ error: 'Không thể cập nhật danh mục' }, { status: 500 })
  }
}
