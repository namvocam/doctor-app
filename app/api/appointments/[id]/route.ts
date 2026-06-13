import { NextResponse, type NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import AppointmentModel from '@/models/Appointment'
import { getCurrentUser } from '@/lib/session'
import { canEditAppointment, canChangeAppointmentStatus } from '@/lib/permissions'

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
    const me = await getCurrentUser()
    if (!me) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    await connectToDatabase()
    const { id } = await ctx.params
    const current = await AppointmentModel.findById(id).lean()
    if (!current) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })

    const isOwner = String((current as { createdBy?: unknown }).createdBy ?? '') === me.userId
    const canFull = canEditAppointment(me.role, isOwner)
    const canStatus = canChangeAppointmentStatus(me.role, isOwner)
    if (!canFull && !canStatus) {
      return NextResponse.json({ error: 'Bạn không có quyền sửa lịch hẹn này' }, { status: 403 })
    }

    const body = await request.json()
    const update: Record<string, unknown> = {}
    // Không đủ quyền sửa đầy đủ -> chỉ cho đổi trạng thái (kết quả)
    const fields = canFull ? ALLOWED_FIELDS : (['result'] as const)
    for (const key of fields) {
      if (!(key in body)) continue
      const value = body[key]
      update[key] = DATE_FIELDS.has(key) ? (value ? new Date(value) : null) : value
    }

    const doc = await AppointmentModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean()
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
    const me = await getCurrentUser()
    if (!me) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    await connectToDatabase()
    const { id } = await ctx.params
    const current = await AppointmentModel.findById(id).lean()
    if (!current) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })

    const isOwner = String((current as { createdBy?: unknown }).createdBy ?? '') === me.userId
    if (!canEditAppointment(me.role, isOwner)) {
      return NextResponse.json({ error: 'Bạn không có quyền xoá lịch hẹn này' }, { status: 403 })
    }

    await AppointmentModel.findByIdAndDelete(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/appointments/[id] error:', error)
    return NextResponse.json({ error: 'Không thể xoá lịch hẹn' }, { status: 500 })
  }
}
