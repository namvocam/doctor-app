import { Schema, model, models, type InferSchemaType } from 'mongoose'

const appointmentSchema = new Schema(
  {
    customerName: { type: String, required: true, trim: true },
    age: { type: Number },
    phone: { type: String, trim: true },
    performAt: { type: Date, required: true },
    doctor: { type: String, trim: true },
    surgery: { type: Boolean, default: false },
    address: { type: String, trim: true },
    province: { type: String, enum: ['Hà Nội', 'Sài Gòn', 'Khác'], default: 'Khác' },
    service1: { type: String, trim: true },
    service2: { type: String, trim: true },
    test: { type: Boolean, default: false },
    telesaleNote: { type: String },
    source: { type: String, trim: true },
    quote: { type: String, trim: true },
    result: { type: String, trim: true },
    dataReceivedAt: { type: Date },
    // Tô màu cam cho dòng cần chú ý (ví dụ: đã chốt phẫu thuật)
    highlight: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export type Appointment = InferSchemaType<typeof appointmentSchema>

export const AppointmentModel =
  models.Appointment ?? model('Appointment', appointmentSchema)

export default AppointmentModel
