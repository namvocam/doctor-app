'use client'

/** Phân trang theo ngày: hiển thị tất cả các ngày trong tháng dưới dạng nút (01..N). */
export default function DayPagination({
  days,
  current,
  onChange,
}: {
  days: number
  current: number
  onChange: (day: number) => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 py-1">
      {Array.from({ length: days }, (_, i) => i + 1).map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition ${
            d === current
              ? 'bg-brand text-white shadow-sm'
              : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {String(d).padStart(2, '0')}
        </button>
      ))}
    </div>
  )
}
