import { NextResponse, type NextRequest } from 'next/server'
import type { UploadApiResponse } from 'cloudinary'
import cloudinary from '@/lib/cloudinary'
import { getCurrentUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

// Upload file (ghi âm) lên Cloudinary - trả về URL
export async function POST(request: NextRequest) {
  try {
    if (!(await getCurrentUser())) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const form = await request.formData()
    const file = form.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Không có file' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: 'auto', folder: 'doctor-app/recordings' },
          (err, res) => {
            if (err || !res) reject(err ?? new Error('Upload thất bại'))
            else resolve(res)
          }
        )
        .end(buffer)
    })

    return NextResponse.json({ url: result.secure_url })
  } catch (error) {
    console.error('POST /api/upload error:', error)
    return NextResponse.json({ error: 'Không thể tải file lên' }, { status: 500 })
  }
}
