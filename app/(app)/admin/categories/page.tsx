import { redirect } from 'next/navigation'
import { Settings2 } from 'lucide-react'
import { getCurrentUser } from '@/lib/session'
import CategoryEditor from '@/components/CategoryEditor'

export const dynamic = 'force-dynamic'

export default async function AdminCategoriesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-800">
          <Settings2 className="h-6 w-6 text-brand" /> Cấu hình danh mục lọc
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Mỗi danh mục là một tab; dữ liệu được tải khi bạn mở tab tương ứng. Thay đổi áp dụng ngay sau khi lưu.
        </p>
      </div>

      <CategoryEditor />
    </div>
  )
}
