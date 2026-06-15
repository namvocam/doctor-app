import { NextResponse, type NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import DailyCostModel from '@/models/DailyCost'
import { getCurrentUser } from '@/lib/session'
import { canManageCosts } from '@/lib/permissions'
import { LEAD_ROLES, ymdToDateKey, type LeadRole } from '@/lib/leadReport'

export const dynamic = 'force-dynamic'

// Danh sách chi phí theo ngày (lọc theo nhóm & khoảng ngày) - mọi user đã đăng nhập.
export async function GET(request: NextRequest) {
  try {
    if (!(await getCurrentUser())) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    await connectToDatabase()

    const sp = request.nextUrl.searchParams
    const roleParam = sp.get('role') ?? 'all'
    const query: Record<string, unknown> = {}
    if (roleParam !== 'all') {
      if (!LEAD_ROLES.includes(roleParam as LeadRole)) {
        return NextResponse.json({ data: [] })
      }
      query.leadRole = roleParam
    }

    const from = sp.get('from')
    const to = sp.get('to')
    if (from || to) {
      const range: Record<string, Date> = {}
      if (from) range.$gte = new Date(from)
      if (to) {
        const end = new Date(to)
        end.setHours(23, 59, 59, 999)
        range.$lte = end
      }
      query.date = range
    }

    const costs = await DailyCostModel.find(query).sort({ date: -1 }).lean()
    return NextResponse.json({
      data: costs.map((c) => ({
        _id: String(c._id),
        leadRole: c.leadRole,
        date: c.date,
        dateKey: c.dateKey,
        totalCost: c.totalCost ?? 0,
        groupCost: c.groupCost ?? 0,
        budget: c.budget ?? 0,
      })),
    })
  } catch (error) {
    console.error('GET /api/daily-costs error:', error)
    return NextResponse.json({ error: 'Không thể tải chi phí' }, { status: 500 })
  }
}

// Tạo/cập nhật chi phí cho 1 (nhóm, ngày) - chỉ admin & kế toán.
export async function POST(request: NextRequest) {
  try {
    const me = await getCurrentUser()
    if (!me) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    if (!canManageCosts(me.role)) {
      return NextResponse.json({ error: 'Bạn không có quyền thực hiện' }, { status: 403 })
    }

    const body = await request.json()
    const leadRole = String(body.leadRole ?? '')
    const ymd = String(body.date ?? '')
    if (!LEAD_ROLES.includes(leadRole as LeadRole)) {
      return NextResponse.json({ error: 'Nhóm không hợp lệ' }, { status: 400 })
    }
    const dateKey = ymdToDateKey(ymd)
    if (!dateKey) {
      return NextResponse.json({ error: 'Ngày không hợp lệ' }, { status: 400 })
    }

    const toNum = (v: unknown) => {
      const n = Number(v)
      return Number.isFinite(n) && n >= 0 ? n : 0
    }

    await connectToDatabase()
    const doc = await DailyCostModel.findOneAndUpdate(
      { leadRole, dateKey },
      {
        leadRole,
        dateKey,
        date: new Date(ymd),
        totalCost: toNum(body.totalCost),
        groupCost: toNum(body.groupCost),
        budget: toNum(body.budget),
        createdBy: me.userId,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean()

    return NextResponse.json({ data: doc }, { status: 201 })
  } catch (error) {
    console.error('POST /api/daily-costs error:', error)
    return NextResponse.json({ error: 'Không thể lưu chi phí' }, { status: 400 })
  }
}
