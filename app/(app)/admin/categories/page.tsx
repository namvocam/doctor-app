import { redirect } from 'next/navigation'
import { Settings2 } from 'lucide-react'
import { connectToDatabase } from '@/lib/mongodb'
import CategoryModel from '@/models/Category'
import { getCurrentUser } from '@/lib/session'

import CategoryEditor from '@/components/CategoryEditor'

export const dynamic = 'force-dynamic'

export default async function AdminCategoriesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')

  await connectToDatabase()
  const categories = await CategoryModel.find().lean()
  const initial: Record<string, { label: string; options: string[] }> = {}
  for (const c of categories) {
    initial[c.type] = { label: c.label, options: c.options ?? [] }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-800">
          <Settings2 className="h-6 w-6 text-brand" /> Cấu hình danh mục lọc
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Quản lý các tuỳ chọn cho bộ lọc ở màn hình Lịch hẹn. Thay đổi sẽ áp dụng ngay sau khi lưu.
        </p>
      </div>

      <CategoryEditor initial={initial} />
    </div>
  )
}
