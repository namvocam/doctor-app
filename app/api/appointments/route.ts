import { NextResponse, type NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import AppointmentModel from '@/models/Appointment'
import { getCurrentUser } from '@/lib/session'

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

    const province = sp.get('province')
    if (province && province !== 'all') query.province = province

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
