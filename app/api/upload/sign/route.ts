import { NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'
import { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME } from '@/lib/config'
import { getCurrentUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

// Tạo chữ ký để client upload TRỰC TIẾP lên Cloudinary (tránh giới hạn body của serverless).
export async function POST() {
  try {
    if (!(await getCurrentUser())) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    if (!CLOUDINARY_API_SECRET || !CLOUDINARY_API_KEY) {
      return NextResponse.json(
        { error: 'Chưa cấu hình Cloudinary (thiếu API key/secret)' },
        { status: 500 }
      )
    }

    const timestamp = Math.round(Date.now() / 1000)
    const folder = 'doctor-app/recordings'
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      CLOUDINARY_API_SECRET
    )

    return NextResponse.json({
      signature,
      timestamp,
      folder,
      apiKey: CLOUDINARY_API_KEY,
      cloudName: CLOUDINARY_CLOUD_NAME,
    })
  } catch (error) {
    console.error('POST /api/upload/sign error:', error)
    return NextResponse.json({ error: 'Không thể tạo chữ ký upload' }, { status: 500 })
  }
}
