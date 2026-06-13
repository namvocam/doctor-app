import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import CategoryModel from '@/models/Category'
import { getCurrentUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

// Lấy tất cả danh mục (dùng cho bộ lọc) - mọi user đã đăng nhập.
export async function GET() {
  try {
    if (!(await getCurrentUser())) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    await connectToDatabase()
    const categories = await CategoryModel.find().lean()
    // Trả về dạng map: { age: {...}, province: {...} }
    const map: Record<string, { label: string; options: string[] }> = {}
    for (const c of categories) {
      map[c.type] = { label: c.label, options: c.options ?? [] }
    }
    return NextResponse.json({ data: map })
  } catch (error) {
    console.error('GET /api/categories error:', error)
    return NextResponse.json({ error: 'Không thể tải danh mục' }, { status: 500 })
  }
}
