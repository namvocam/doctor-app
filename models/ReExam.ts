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
    // Liên kết tới ca phẫu thuật (lịch hẹn) + thông tin tái khám
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    preExamCondition: { type: String }, // Tình trạng trước khám
    doctorInstruction: { type: String }, // Chỉ định của bác sĩ
    note: { type: String }, // Ghi chú
  },
  { timestamps: true }
)

export type ReExam = InferSchemaType<typeof reExamSchema>

export const ReExamModel = models.ReExam ?? model('ReExam', reExamSchema)

export default ReExamModel
