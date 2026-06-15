import { Schema, model, models, type InferSchemaType } from 'mongoose'
import { LEAD_ROLES, COST_INPUT_FIELDS } from '@/lib/leadReport'

/**
 * Số liệu theo ngày do kế toán nhập, tách theo từng nhóm LEAD (ADS/Tiktok/CTV).
 * Mỗi (leadRole, dateKey) là duy nhất → upsert khi nhập lại cùng ngày/nhóm.
 * - dateKey: 'dd/mm/yyyy' để khớp trực tiếp với dòng báo cáo.
 * - date: mốc ngày (00:00 UTC) để lọc khoảng & sắp xếp.
 * - 17 ô số (doanh thu, chi phí, các số đếm vận hành) lấy từ COST_INPUT_FIELDS.
 */
const numberFields: Record<string, { type: NumberConstructor; default: number }> = {}
for (const k of COST_INPUT_FIELDS) numberFields[k] = { type: Number, default: 0 }

const dailyCostSchema = new Schema(
  {
    leadRole: { type: String, enum: [...LEAD_ROLES] as string[], required: true },
    date: { type: Date, required: true },
    dateKey: { type: String, required: true, trim: true },
    ...numberFields,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

dailyCostSchema.index({ leadRole: 1, dateKey: 1 }, { unique: true })

export type DailyCost = InferSchemaType<typeof dailyCostSchema>

export const DailyCostModel = models.DailyCost ?? model('DailyCost', dailyCostSchema)

export default DailyCostModel
