import { NextResponse, type NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import AppointmentModel from '@/models/Appointment'
import SourceRoleModel from '@/models/SourceRole'
import DailyCostModel from '@/models/DailyCost'
import { getCurrentUser } from '@/lib/session'
import {
  LEAD_ROLES,
  COST_INPUT_FIELDS,
  RESULT_FAIL_AT_SITE,
  RESULT_DOCTOR_REJECT,
  type LeadRole,
} from '@/lib/leadReport'

export const dynamic = 'force-dynamic'

const TZ = 'Asia/Ho_Chi_Minh'

/** Tên các ô số thô gửi về client (kế toán nhập + 2 cột suy từ lịch hẹn). */
const RAW_FIELDS = [...COST_INPUT_FIELDS, 'failAtSite', 'failDoctorReject'] as const

function emptyMetrics(): Record<string, number> {
  const o: Record<string, number> = {}
  for (const k of RAW_FIELDS) o[k] = 0
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

    // Khoảng ngày (dùng chung cho lịch hẹn & số liệu kế toán)
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

    // Gom theo dateKey ('dd/mm/yyyy')
    interface Acc {
      date: string
      sortDate: Date
      metrics: Record<string, number>
    }
    const byDate = new Map<string, Acc>()
    const ensure = (key: string, sort: Date): Acc => {
      let r = byDate.get(key)
      if (!r) {
        r = { date: key, sortDate: sort, metrics: emptyMetrics() }
        byDate.set(key, r)
      } else if (sort < r.sortDate) {
        r.sortDate = sort
      }
      return r
    }

    // --- Số liệu kế toán nhập (17 ô), gộp các nhóm khi role='all' ---
    const costQuery: Record<string, unknown> = { leadRole: { $in: roles } }
    if (dateRange) costQuery.date = dateRange
    const costs = await DailyCostModel.find(costQuery).lean()
    for (const c of costs) {
      const r = ensure(c.dateKey as string, c.date as Date)
      for (const k of COST_INPUT_FIELDS) {
        r.metrics[k] += ((c as Record<string, unknown>)[k] as number) ?? 0
      }
    }

    // --- 2 cột suy từ lịch hẹn: đếm theo trạng thái, theo nguồn thuộc nhóm ---
    const mappings = await SourceRoleModel.find({ role: { $in: roles } }).lean()
    const sources = mappings.map((m) => m.source)
    if (sources.length > 0) {
      const match: Record<string, unknown> = {
        source: { $in: sources },
        result: { $in: [RESULT_FAIL_AT_SITE, RESULT_DOCTOR_REJECT] },
        dataReceivedAt: dateRange ?? { $ne: null },
      }
      const grouped = await AppointmentModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%d/%m/%Y', date: '$dataReceivedAt', timezone: TZ } },
            failAtSite: { $sum: { $cond: [{ $eq: ['$result', RESULT_FAIL_AT_SITE] }, 1, 0] } },
            failDoctorReject: { $sum: { $cond: [{ $eq: ['$result', RESULT_DOCTOR_REJECT] }, 1, 0] } },
            sortKey: { $min: '$dataReceivedAt' },
          },
        },
      ])
      for (const grp of grouped) {
        const r = ensure(grp._id as string, grp.sortKey as Date)
        r.metrics.failAtSite += (grp.failAtSite as number) ?? 0
        r.metrics.failDoctorReject += (grp.failDoctorReject as number) ?? 0
      }
    }

    const sorted = [...byDate.values()].sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime())
    const rows = sorted.map((r) => {
      const row: Record<string, unknown> = { date: r.date }
      for (const k of RAW_FIELDS) row[k] = r.metrics[k]
      return row
    })

    const totals = emptyMetrics()
    for (const r of sorted) {
      for (const k of RAW_FIELDS) totals[k] += r.metrics[k]
    }

    // `total` (số) giữ lại để tương thích phần thống kê cũ.
    return NextResponse.json({ rows, total: totals.revenue, totals })
  } catch (error) {
    console.error('GET /api/lead-report error:', error)
    return NextResponse.json({ error: 'Không thể tải báo cáo' }, { status: 500 })
  }
}
