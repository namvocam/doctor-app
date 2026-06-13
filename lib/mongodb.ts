import mongoose from 'mongoose'
import { MONGODB_URI } from '@/lib/config'

/**
 * Cache lại kết nối trên `global` để tránh tạo nhiều kết nối khi
 * Next.js hot-reload trong môi trường dev, và để tái sử dụng kết nối
 * giữa các lần gọi serverless function.
 */
interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var _mongoose: MongooseCache | undefined
}

const cached: MongooseCache = global._mongoose ?? { conn: null, promise: null }

if (!global._mongoose) {
  global._mongoose = cached
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (error) {
    cached.promise = null
    throw error
  }

  return cached.conn
}
