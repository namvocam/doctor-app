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
    province: { type: String, trim: true },
    service1: { type: String, trim: true },
    service2: { type: String, trim: true },
    test: { type: Boolean, default: false },
    telesaleNote: { type: String },
    source: { type: String, trim: true },
    subSource: { type: String, trim: true }, // Nguồn phụ
    groupSource: { type: String, trim: true }, // Nguồn gr tiếp cận sau
    telesale: { type: String, trim: true }, // Telesale
    telesaleCtv: { type: String, trim: true }, // Telesale CTV
    sale1: { type: String, trim: true }, // Sale 1
    sale2: { type: String, trim: true }, // Sale 2
    quote: { type: String, trim: true },
    result: { type: String, trim: true },
    saleNote: { type: String }, // Ghi chú của sale
    media: { type: String, trim: true }, // Media
    mktNote: { type: String }, // Ghi chú của MKT
    dataReceivedAt: { type: Date }, // Ngày nhận data
    recording: { type: String, trim: true }, // Ghi âm (URL)
    revenue: { type: Number, default: 0 }, // Doanh thu
    // Tô màu cam cho dòng cần chú ý (ví dụ: đã chốt phẫu thuật)
    highlight: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }, // Người tạo
  },
  { timestamps: true }
)

export type Appointment = InferSchemaType<typeof appointmentSchema>

export const AppointmentModel =
  models.Appointment ?? model('Appointment', appointmentSchema)

export default AppointmentModel
