import { Schema, model, models, type InferSchemaType } from 'mongoose'
import { LEAD_ROLES } from '@/lib/leadReport'

/**
 * Chi phí theo ngày do kế toán nhập, tách theo từng nhóm LEAD (ADS/Tiktok/CTV).
 * Mỗi (leadRole, dateKey) là duy nhất → upsert khi nhập lại cùng ngày/nhóm.
 * - dateKey: 'dd/mm/yyyy' để khớp trực tiếp với dòng báo cáo.
 * - date: mốc ngày (00:00 UTC) để lọc khoảng & sắp xếp.
 */
const dailyCostSchema = new Schema(
  {
    leadRole: { type: String, enum: [...LEAD_ROLES] as string[], required: true },
    date: { type: Date, required: true },
    dateKey: { type: String, required: true, trim: true },
    totalCost: { type: Number, default: 0 }, // Tổng chi phí
    groupCost: { type: Number, default: 0 }, // Chi phí thuê group
    budget: { type: Number, default: 0 }, // Ngân sách
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

dailyCostSchema.index({ leadRole: 1, dateKey: 1 }, { unique: true })

export type DailyCost = InferSchemaType<typeof dailyCostSchema>

export const DailyCostModel = models.DailyCost ?? model('DailyCost', dailyCostSchema)

export default DailyCostModel
