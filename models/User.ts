import { Schema, model, models, type InferSchemaType } from 'mongoose'

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['admin', 'doctor', 'sale', 'ads'], default: 'ads' },
  },
  { timestamps: true }
)

export type User = InferSchemaType<typeof userSchema>

export const UserModel = models.User ?? model('User', userSchema)

export default UserModel
