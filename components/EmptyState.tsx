import { Search, RotateCcw, type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  message?: string
  description?: string
  action?: { label: string; onClick: () => void }
}

/** Trạng thái không có dữ liệu: icon + thông điệp (+ mô tả & nút hành động tuỳ chọn). */
export default function EmptyState({
  icon: Icon = Search,
  message = 'Chưa có dữ liệu',
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-400">
      <Icon className="h-10 w-10" strokeWidth={1.5} />
      <p className="mt-1 text-base font-semibold text-gray-600">{message}</p>
      {description && <p className="text-sm text-gray-400">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-3 flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark"
        >
          <RotateCcw className="h-4 w-4" /> {action.label}
        </button>
      )}
    </div>
  )
}
