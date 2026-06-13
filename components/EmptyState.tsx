import { Search } from 'lucide-react'

/** Trạng thái không có dữ liệu: icon kính lúp + thông điệp. */
export default function EmptyState({ message = 'Chưa có dữ liệu' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
      <Search className="h-10 w-10" strokeWidth={1.5} />
      <p className="text-base font-medium text-gray-500">{message}</p>
    </div>
  )
}
