import { Schema, model, models, type InferSchemaType } from 'mongoose'
import { CATEGORY_TYPES, CATEGORY_LABELS, type CategoryType } from '@/lib/categories'

export { CATEGORY_TYPES, CATEGORY_LABELS }
export type { CategoryType }

const categorySchema = new Schema(
  {
    type: { type: String, enum: CATEGORY_TYPES as unknown as string[], required: true, unique: true },
    label: { type: String, required: true, trim: true },
    options: { type: [String], default: [] },
  },
  { timestamps: true }
)

export type Category = InferSchemaType<typeof categorySchema>

export const CategoryModel = models.Category ?? model('Category', categorySchema)

export default CategoryModel
