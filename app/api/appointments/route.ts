import { NextResponse, type NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import AppointmentModel from '@/models/Appointment'
import { getCurrentUser } from '@/lib/session'
import { canCreateAppointment } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}
function endOfToday() {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d
}

/** Chuyển nhãn độ tuổi ("Dưới 20", "20 - 30", "Trên 60") thành điều kiện query. */
function ageLabelToQuery(label: string): Record<string, number> | null {
  if (/dưới/i.test(label)) {
    const n = parseInt(label.replace(/\D/g, ''), 10)
    return Number.isFinite(n) ? { $lt: n } : null
  }
  if (/trên/i.test(label)) {
    const n = parseInt(label.replace(/\D/g, ''), 10)
    return Number.isFinite(n) ? { $gt: n } : null
  }
  const m = label.match(/(\d+)\s*-\s*(\d+)/)
  if (m) return { $gte: Number(m[1]), $lte: Number(m[2]) }
  return null
}

const CREATE_FIELDS = [
  'customerName', 'age', 'phone', 'performAt', 'doctor', 'surgery', 'address',
  'province', 'service1', 'service2', 'test', 'telesaleNote', 'source', 'subSource',
  'groupSource', 'telesale', 'telesaleCtv', 'sale1', 'sale2', 'quote', 'result',
  'saleNote', 'media', 'mktNote', 'dataReceivedAt', 'recording', 'revenue', 'highlight',
] as const
const DATE_FIELDS = new Set(['performAt', 'dataReceivedAt'])

// Tạo mới lịch hẹn
export async function POST(request: NextRequest) {
  try {
    const me = await getCurrentUser()
    if (!me) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    if (!canCreateAppointment(me.role)) {
      return NextResponse.json({ error: 'Bạn không có quyền tạo lịch hẹn' }, { status: 403 })
    }
    const body = await request.json()
    if (!body.customerName || !body.performAt) {
      return NextResponse.json(
        { error: 'Thiếu tên khách hàng hoặc ngày giờ thực hiện' },
        { status: 400 }
      )
    }

    const doc: Record<string, unknown> = {}
    for (const key of CREATE_FIELDS) {
      if (!(key in body)) continue
      const value = body[key]
      doc[key] = DATE_FIELDS.has(key) ? (value ? new Date(value) : undefined) : value
    }

    doc.createdBy = me.userId
    await connectToDatabase()
    const created = await AppointmentModel.create(doc)
    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('POST /api/appointments error:', error)
    return NextResponse.json({ error: 'Không thể tạo lịch hẹn' }, { status: 400 })
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!(await getCurrentUser())) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    await connectToDatabase()

    const sp = request.nextUrl.searchParams
    const query: Record<string, unknown> = {}

    const q = sp.get('q')?.trim()
    if (q) {
      query.$or = [
        { customerName: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ]
    }

    const province = sp.get('province')?.trim()
    if (province) query.province = province

    const service = sp.get('service')?.trim()
    if (service) {
      query.$and = [
        {
          $or: [
            { service1: { $regex: service, $options: 'i' } },
            { service2: { $regex: service, $options: 'i' } },
          ],
        },
      ]
    }

    const age = sp.get('age')?.trim()
    if (age) {
      const ageQuery = ageLabelToQuery(age)
      if (ageQuery) query.age = ageQuery
    }

    const quote = sp.get('quote')?.trim()
    if (quote) query.quote = quote

    const source = sp.get('source')?.trim()
    if (source) query.source = source

    const result = sp.get('result')?.trim()
    if (result) query.result = result

    // Lọc theo ngày nhận data
    const dataFrom = sp.get('dataFrom')
    const dataTo = sp.get('dataTo')
    if (dataFrom || dataTo) {
      const range: Record<string, Date> = {}
      if (dataFrom) range.$gte = new Date(dataFrom)
      if (dataTo) range.$lte = new Date(dataTo)
      query.dataReceivedAt = range
    }

    const view = sp.get('view')
    const from = sp.get('from')
    const to = sp.get('to')
    if (view === 'today') {
      query.performAt = { $gte: startOfToday(), $lte: endOfToday() }
    } else if (from || to) {
      const range: Record<string, Date> = {}
      if (from) range.$gte = new Date(from)
      if (to) range.$lte = new Date(to)
      query.performAt = range
    }

    const page = Math.max(1, Number(sp.get('page') ?? '1'))
    const limit = Math.min(100, Math.max(1, Number(sp.get('limit') ?? '20')))

    const [data, total] = await Promise.all([
      AppointmentModel.find(query)
        .sort({ performAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AppointmentModel.countDocuments(query),
    ])

    return NextResponse.json({ data, total, page, limit })
  } catch (error) {
    console.error('GET /api/appointments error:', error)
    return NextResponse.json(
      { error: 'Không thể tải danh sách lịch hẹn' },
      { status: 500 }
    )
  }
}
