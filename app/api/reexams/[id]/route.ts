import { NextResponse, type NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import ReExamModel from '@/models/ReExam'
import { getCurrentUser } from '@/lib/session'
import { canEditReExam } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

const ALLOWED_FIELDS = [
  'customerName', 'phone', 'reExamDate', 'time', 'status', 'service', 'surgeryDate',
  'media', 'doctor', 'sale1', 'preExamCondition', 'doctorInstruction', 'note',
] as const

const DATE_FIELDS = new Set(['reExamDate', 'surgeryDate'])

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
    const current = await ReExamModel.findById(id).lean()
    if (!current) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })
    const isOwner = String((current as { createdBy?: unknown }).createdBy ?? '') === me.userId
    if (!canEditReExam(me.role, isOwner)) {
      return NextResponse.json({ error: 'Bạn không có quyền sửa lịch tái khám này' }, { status: 403 })
    }

    const body = await request.json()
    const update: Record<string, unknown> = {}
    for (const key of ALLOWED_FIELDS) {
      if (!(key in body)) continue
      const value = body[key]
      update[key] = DATE_FIELDS.has(key) ? (value ? new Date(value) : null) : value
    }

    const doc = await ReExamModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean()
    return NextResponse.json({ data: doc })
  } catch (error) {
    console.error('PUT /api/reexams/[id] error:', error)
    return NextResponse.json({ error: 'Không thể cập nhật lịch tái khám' }, { status: 400 })
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
    const current = await ReExamModel.findById(id).lean()
    if (!current) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })
    const isOwner = String((current as { createdBy?: unknown }).createdBy ?? '') === me.userId
    if (!canEditReExam(me.role, isOwner)) {
      return NextResponse.json({ error: 'Bạn không có quyền xoá lịch tái khám này' }, { status: 403 })
    }
    await ReExamModel.findByIdAndDelete(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/reexams/[id] error:', error)
    return NextResponse.json({ error: 'Không thể xoá lịch tái khám' }, { status: 500 })
  }
}
