import { NextResponse, type NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import AppointmentModel from '@/models/Appointment'
import { getCurrentUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

const ALLOWED_FIELDS = [
  'customerName', 'age', 'phone', 'performAt', 'doctor', 'surgery', 'address',
  'province', 'service1', 'service2', 'test', 'telesaleNote', 'source', 'subSource',
  'groupSource', 'telesale', 'telesaleCtv', 'sale1', 'sale2', 'quote', 'result',
  'saleNote', 'media', 'mktNote', 'dataReceivedAt', 'recording', 'revenue', 'highlight',
] as const

const DATE_FIELDS = new Set(['performAt', 'dataReceivedAt'])

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await getCurrentUser())) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    await connectToDatabase()
    const { id } = await ctx.params
    const doc = await AppointmentModel.findById(id).lean()
    if (!doc) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })
    return NextResponse.json({ data: doc })
  } catch (error) {
    console.error('GET /api/appointments/[id] error:', error)
    return NextResponse.json({ error: 'Không thể tải lịch hẹn' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await getCurrentUser())) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    await connectToDatabase()
    const { id } = await ctx.params
    const body = await request.json()

    const update: Record<string, unknown> = {}
    for (const key of ALLOWED_FIELDS) {
      if (!(key in body)) continue
      const value = body[key]
      if (DATE_FIELDS.has(key)) {
        update[key] = value ? new Date(value) : null
      } else {
        update[key] = value
      }
    }

    const doc = await AppointmentModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean()
    if (!doc) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })
    return NextResponse.json({ data: doc })
  } catch (error) {
    console.error('PUT /api/appointments/[id] error:', error)
    return NextResponse.json({ error: 'Không thể cập nhật lịch hẹn' }, { status: 400 })
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await getCurrentUser())) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    await connectToDatabase()
    const { id } = await ctx.params
    const doc = await AppointmentModel.findByIdAndDelete(id).lean()
    if (!doc) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/appointments/[id] error:', error)
    return NextResponse.json({ error: 'Không thể xoá lịch hẹn' }, { status: 500 })
  }
}
