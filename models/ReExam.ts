import { Schema, model, models, type InferSchemaType } from 'mongoose'

export const REEXAM_STATUSES = [
  'Đã lên lịch',
  'Đã tái khám',
  'Quá hạn',
  'Phàn nàn',
  'Đã huỷ',
] as const

const reExamSchema = new Schema(
  {
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    reExamDate: { type: Date, required: true },
    time: { type: String, trim: true },
    status: { type: String, enum: REEXAM_STATUSES, default: 'Đã lên lịch' },
    service: { type: String, trim: true },
    surgeryDate: { type: Date },
    media: { type: String, trim: true },
    doctor: { type: String, trim: true },
    sale1: { type: String, trim: true },
  },
  { timestamps: true }
)

export type ReExam = InferSchemaType<typeof reExamSchema>

export const ReExamModel = models.ReExam ?? model('ReExam', reExamSchema)

export default ReExamModel
