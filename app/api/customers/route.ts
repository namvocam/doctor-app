import { NextResponse, type NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import AppointmentModel from '@/models/Appointment'
import { getCurrentUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

// Tìm khách hàng (gom nhóm từ lịch hẹn theo số điện thoại).
export async function GET(request: NextRequest) {
  try {
    if (!(await getCurrentUser())) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    await connectToDatabase()

    const q = request.nextUrl.searchParams.get('q')?.trim()
    const match: Record<string, unknown> = {}
    if (q) {
      match.$or = [
        { customerName: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ]
    }

    const customers = await AppointmentModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$phone',
          customerName: { $first: '$customerName' },
          age: { $first: '$age' },
          surgeryCount: { $sum: 1 },
        },
      },
      { $sort: { customerName: 1 } },
      { $limit: 30 },
    ])

    const data = customers.map((c) => ({
      phone: c._id as string,
      customerName: c.customerName as string,
      age: c.age as number | undefined,
      surgeryCount: c.surgeryCount as number,
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error('GET /api/customers error:', error)
    return NextResponse.json({ error: 'Không thể tìm khách hàng' }, { status: 500 })
  }
}
