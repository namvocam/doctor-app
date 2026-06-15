import { NextResponse, type NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import DailyCostModel from '@/models/DailyCost'
import { getCurrentUser } from '@/lib/session'
import { LEAD_ROLES, COST_INPUT_FIELDS, type LeadRole } from '@/lib/leadReport'

export const dynamic = 'force-dynamic'

function emptyMetrics(): Record<string, number> {
  const o: Record<string, number> = {}
  for (const k of COST_INPUT_FIELDS) o[k] = 0
  return o
}

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
      return NextResponse.json({ rows: [], total: 0, totals: emptyMetrics() })
    }

    // Khoảng ngày
    const from = sp.get('from')
    const to = sp.get('to')
    const query: Record<string, unknown> = { leadRole: { $in: roles } }
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

    // Gom số liệu kế toán theo ngày ('dd/mm/yyyy'); nhóm 'all' = cộng dồn các nhóm.
    interface Acc {
      date: string
      sortDate: Date
      metrics: Record<string, number>
    }
    const byDate = new Map<string, Acc>()
    const costs = await DailyCostModel.find(query).lean()
    for (const c of costs) {
      const key = c.dateKey as string
      let r = byDate.get(key)
      if (!r) {
        r = { date: key, sortDate: c.date as Date, metrics: emptyMetrics() }
        byDate.set(key, r)
      } else if ((c.date as Date) < r.sortDate) {
        r.sortDate = c.date as Date
      }
      for (const k of COST_INPUT_FIELDS) {
        r.metrics[k] += ((c as Record<string, unknown>)[k] as number) ?? 0
      }
    }

    const sorted = [...byDate.values()].sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime())
    const rows = sorted.map((r) => {
      const row: Record<string, unknown> = { date: r.date }
      for (const k of COST_INPUT_FIELDS) row[k] = r.metrics[k]
      return row
    })

    const totals = emptyMetrics()
    for (const r of sorted) {
      for (const k of COST_INPUT_FIELDS) totals[k] += r.metrics[k]
    }

    // `total` (số) giữ lại để tương thích phần thống kê cũ.
    return NextResponse.json({ rows, total: totals.revenue, totals })
  } catch (error) {
    console.error('GET /api/lead-report error:', error)
    return NextResponse.json({ error: 'Không thể tải báo cáo' }, { status: 500 })
  }
}
