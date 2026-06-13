import { Schema, model, models, type InferSchemaType } from 'mongoose'
import { LEAD_ROLES } from '@/lib/leadReport'

/** Ánh xạ mỗi Nguồn (source) tới 1 vai trò báo cáo, hoặc 'none' nếu không tính. */
const sourceRoleSchema = new Schema(
  {
    source: { type: String, required: true, unique: true, trim: true },
    role: {
      type: String,
      enum: [...LEAD_ROLES, 'none'] as string[],
      default: 'none',
    },
  },
  { timestamps: true }
)

export type SourceRole = InferSchemaType<typeof sourceRoleSchema>

export const SourceRoleModel = models.SourceRole ?? model('SourceRole', sourceRoleSchema)

export default SourceRoleModel
