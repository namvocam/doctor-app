import { NextResponse, type NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import AppointmentModel from '@/models/Appointment'
import SourceRoleModel from '@/models/SourceRole'
import { getCurrentUser } from '@/lib/session'
import { LEAD_ROLES, REVENUE_RESULT, type LeadRole } from '@/lib/leadReport'

export const dynamic = 'force-dynamic'

const TZ = 'Asia/Ho_Chi_Minh'

export async function GET(request: NextRequest) {
  try {
    if (!(await getCurrentUser())) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    await connectToDatabase()

    const sp = request.nextUrl.searchParams
    const roleParam = sp.get('role') ?? 'all'
    const roles: string[] =
      roleParam === 'all' ? [...LEAD_ROLES] : LEAD_ROLES.includes(roleParam as LeadRole) ? [roleParam] : []

    // Các nguồn thuộc (các) role yêu cầu
    const mappings = await SourceRoleModel.find({ role: { $in: roles } }).lean()
    const sources = mappings.map((m) => m.source)

    // Nếu không có nguồn nào gắn role -> báo cáo rỗng
    if (sources.length === 0) {
      return NextResponse.json({ rows: [], total: 0 })
    }

    const match: Record<string, unknown> = {
      result: REVENUE_RESULT,
      source: { $in: sources },
      dataReceivedAt: { $ne: null },
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
      match.dataReceivedAt = range
    }

    const grouped = await AppointmentModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%d/%m/%Y', date: '$dataReceivedAt', timezone: TZ } },
          revenue: { $sum: '$revenue' },
          count: { $sum: 1 },
          sortKey: { $min: '$dataReceivedAt' },
        },
      },
      { $sort: { sortKey: 1 } },
    ])

    const rows = grouped.map((g) => ({
      date: g._id as string,
      revenue: g.revenue as number,
      count: g.count as number,
    }))
    const total = rows.reduce((s, r) => s + r.revenue, 0)

    return NextResponse.json({ rows, total })
  } catch (error) {
    console.error('GET /api/lead-report error:', error)
    return NextResponse.json({ error: 'Không thể tải báo cáo' }, { status: 500 })
  }
}
