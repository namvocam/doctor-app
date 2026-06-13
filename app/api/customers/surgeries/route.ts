import { NextResponse, type NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import AppointmentModel from '@/models/Appointment'
import ReExamModel from '@/models/ReExam'
import { getCurrentUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

// Danh sách ca phẫu thuật (lịch hẹn) của 1 khách hàng + số lịch tái khám đã có.
export async function GET(request: NextRequest) {
  try {
    if (!(await getCurrentUser())) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    const phone = request.nextUrl.searchParams.get('phone')?.trim()
    if (!phone) {
      return NextResponse.json({ data: [] })
    }

    await connectToDatabase()
    const appts = await AppointmentModel.find({ phone })
      .sort({ performAt: -1 })
      .lean()

    const data = await Promise.all(
      appts.map(async (a) => ({
        _id: String(a._id),
        service1: a.service1 ?? '',
        service2: a.service2 ?? '',
        performAt: a.performAt,
        doctor: a.doctor ?? '',
        reExamCount: await ReExamModel.countDocuments({ appointmentId: a._id }),
      }))
    )

    return NextResponse.json({ data })
  } catch (error) {
    console.error('GET /api/customers/surgeries error:', error)
    return NextResponse.json({ error: 'Không thể tải danh sách phẫu thuật' }, { status: 500 })
  }
}
