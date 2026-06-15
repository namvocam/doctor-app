import { NextResponse, type NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import DailyCostModel from '@/models/DailyCost'
import { getCurrentUser } from '@/lib/session'
import { canManageCosts } from '@/lib/permissions'
import { LEAD_ROLES, COST_INPUT_FIELDS, ymdToDateKey, type LeadRole } from '@/lib/leadReport'

export const dynamic = 'force-dynamic'

// Danh sách số liệu theo ngày (lọc theo nhóm & khoảng ngày) - mọi user đã đăng nhập.
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
      data: costs.map((c) => {
        const row: Record<string, unknown> = {
          _id: String(c._id),
          leadRole: c.leadRole,
          date: c.date,
          dateKey: c.dateKey,
        }
        for (const k of COST_INPUT_FIELDS) row[k] = (c as Record<string, unknown>)[k] ?? 0
        return row
      }),
    })
  } catch (error) {
    console.error('GET /api/daily-costs error:', error)
    return NextResponse.json({ error: 'Không thể tải số liệu' }, { status: 500 })
  }
}

// Tạo/cập nhật số liệu cho 1 (nhóm, ngày) - chỉ admin & kế toán.
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

    const update: Record<string, unknown> = {
      leadRole,
      dateKey,
      date: new Date(ymd),
      createdBy: me.userId,
    }
    for (const k of COST_INPUT_FIELDS) update[k] = toNum(body[k])

    await connectToDatabase()
    const doc = await DailyCostModel.findOneAndUpdate(
      { leadRole, dateKey },
      update,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean()

    return NextResponse.json({ data: doc }, { status: 201 })
  } catch (error) {
    console.error('POST /api/daily-costs error:', error)
    return NextResponse.json({ error: 'Không thể lưu số liệu' }, { status: 400 })
  }
}
