import { NextResponse, type NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import ReExamModel from '@/models/ReExam'
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

    const name = sp.get('name')?.trim()
    if (name) query.customerName = { $regex: name, $options: 'i' }

    const phone = sp.get('phone')?.trim()
    if (phone) query.phone = { $regex: phone, $options: 'i' }

    const doctor = sp.get('doctor')?.trim()
    if (doctor) query.doctor = { $regex: doctor, $options: 'i' }

    const status = sp.get('status')?.trim()
    if (status) query.status = status

    const service = sp.get('service')?.trim()
    if (service) query.service = { $regex: service, $options: 'i' }

    const view = sp.get('view')
    const from = sp.get('from')
    const to = sp.get('to')
    if (view === 'today') {
      query.reExamDate = { $gte: startOfToday(), $lte: endOfToday() }
    } else if (from || to) {
      const range: Record<string, Date> = {}
      if (from) range.$gte = new Date(from)
      if (to) range.$lte = new Date(to)
      query.reExamDate = range
    }

    const page = Math.max(1, Number(sp.get('page') ?? '1'))
    const limit = Math.min(100, Math.max(1, Number(sp.get('limit') ?? '20')))

    const [data, total, overdue, complaints] = await Promise.all([
      ReExamModel.find(query)
        .sort({ reExamDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ReExamModel.countDocuments(query),
      ReExamModel.countDocuments({ ...query, status: 'Quá hạn' }),
      ReExamModel.countDocuments({ ...query, status: 'Phàn nàn' }),
    ])

    return NextResponse.json({
      data,
      total,
      stats: { total, overdue, complaints },
      page,
      limit,
    })
  } catch (error) {
    console.error('GET /api/reexams error:', error)
    return NextResponse.json(
      { error: 'Không thể tải danh sách tái khám' },
      { status: 500 }
    )
  }
}
