import { Schema, model, models, type InferSchemaType } from 'mongoose'
import { REEXAM_STATUSES, DEFAULT_REEXAM_STATUS } from '@/lib/reexamStatus'

export { REEXAM_STATUSES }

const reExamSchema = new Schema(
  {
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    reExamDate: { type: Date, required: true },
    time: { type: String, trim: true },
    status: { type: String, enum: REEXAM_STATUSES as unknown as string[], default: DEFAULT_REEXAM_STATUS },
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
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }, // Người tạo
  },
  { timestamps: true }
)

export type ReExam = InferSchemaType<typeof reExamSchema>

export const ReExamModel = models.ReExam ?? model('ReExam', reExamSchema)

export default ReExamModel
