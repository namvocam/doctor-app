import { Schema, model, models, type InferSchemaType } from 'mongoose'

const doctorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    specialty: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    bio: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export type Doctor = InferSchemaType<typeof doctorSchema>

// Tránh redefine model khi hot-reload trong dev.
export const DoctorModel = models.Doctor ?? model('Doctor', doctorSchema)

export default DoctorModel
