import { NextResponse, type NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import AppointmentModel from '@/models/Appointment'
import SourceRoleModel from '@/models/SourceRole'
import DailyCostModel from '@/models/DailyCost'
import { getCurrentUser } from '@/lib/session'
import { LEAD_ROLES, REVENUE_RESULT, type LeadRole } from '@/lib/leadReport'

interface ReportRow {
  date: string
  revenue: number
  count: number
  totalCost: number
  groupCost: number
  budget: number
}

function emptyTotals() {
  return { revenue: 0, totalCost: 0, groupCost: 0, budget: 0 }
}

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

    if (roles.length === 0) {
      return NextResponse.json({ rows: [], total: 0, totals: emptyTotals() })
    }

    // Khoảng ngày (dùng chung cho doanh thu & chi phí)
    const from = sp.get('from')
    const to = sp.get('to')
    let dateRange: Record<string, Date> | null = null
    if (from || to) {
      dateRange = {}
      if (from) dateRange.$gte = new Date(from)
      if (to) {
        const end = new Date(to)
        end.setHours(23, 59, 59, 999)
        dateRange.$lte = end
      }
    }

    // Gom theo dateKey ('dd/mm/yyyy'): doanh thu + chi phí
    const byDate = new Map<string, ReportRow & { sortDate: Date }>()
    const ensure = (key: string, sort: Date) => {
      let r = byDate.get(key)
      if (!r) {
        r = { date: key, revenue: 0, count: 0, totalCost: 0, groupCost: 0, budget: 0, sortDate: sort }
        byDate.set(key, r)
      } else if (sort < r.sortDate) {
        r.sortDate = sort
      }
      return r
    }

    // --- Doanh thu: từ lịch hẹn đã phẫu thuật của các nguồn thuộc role ---
    const mappings = await SourceRoleModel.find({ role: { $in: roles } }).lean()
    const sources = mappings.map((m) => m.source)
    if (sources.length > 0) {
      const match: Record<string, unknown> = {
        result: REVENUE_RESULT,
        source: { $in: sources },
        dataReceivedAt: dateRange ?? { $ne: null },
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
      ])
      for (const g of grouped) {
        const r = ensure(g._id as string, g.sortKey as Date)
        r.revenue += (g.revenue as number) ?? 0
        r.count += (g.count as number) ?? 0
      }
    }

    // --- Chi phí: do kế toán nhập, gộp các nhóm khi role='all' ---
    const costQuery: Record<string, unknown> = { leadRole: { $in: roles } }
    if (dateRange) costQuery.date = dateRange
    const costs = await DailyCostModel.find(costQuery).lean()
    for (const c of costs) {
      const r = ensure(c.dateKey as string, c.date as Date)
      r.totalCost += (c.totalCost as number) ?? 0
      r.groupCost += (c.groupCost as number) ?? 0
      r.budget += (c.budget as number) ?? 0
    }

    const rows: ReportRow[] = [...byDate.values()]
      .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime())
      .map((r) => ({
        date: r.date,
        revenue: r.revenue,
        count: r.count,
        totalCost: r.totalCost,
        groupCost: r.groupCost,
        budget: r.budget,
      }))

    const totals = rows.reduce(
      (s, r) => ({
        revenue: s.revenue + r.revenue,
        totalCost: s.totalCost + r.totalCost,
        groupCost: s.groupCost + r.groupCost,
        budget: s.budget + r.budget,
      }),
      emptyTotals()
    )

    // `total` (số) giữ lại để tương thích phần thống kê cũ.
    return NextResponse.json({ rows, total: totals.revenue, totals })
  } catch (error) {
    console.error('GET /api/lead-report error:', error)
    return NextResponse.json({ error: 'Không thể tải báo cáo' }, { status: 500 })
  }
}
