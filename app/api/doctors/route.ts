import { NextResponse, type NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import DoctorModel from '@/models/Doctor'

// Route handler luôn chạy động vì có truy vấn database.
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await connectToDatabase()
    const doctors = await DoctorModel.find().sort({ createdAt: -1 }).lean()
    return NextResponse.json({ data: doctors })
  } catch (error) {
    console.error('GET /api/doctors error:', error)
    return NextResponse.json(
      { error: 'Không thể tải danh sách bác sĩ' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const body = await request.json()
    const doctor = await DoctorModel.create(body)
    return NextResponse.json({ data: doctor }, { status: 201 })
  } catch (error) {
    console.error('POST /api/doctors error:', error)
    return NextResponse.json(
      { error: 'Không thể tạo bác sĩ' },
      { status: 400 }
    )
  }
}
