'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatNumber } from '@/lib/format'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  unit?: string
  /** Nếu có, thay thế dòng "Hiển thị X - Y trong tổng số Z" bên trái. */
  summary?: string
  onPageChange: (page: number) => void
}

const DOTS = '...'

/** Tạo danh sách số trang kèm dấu "..." (1 2 3 ... 193 194). */
function getRange(current: number, totalPages: number, siblings = 2): (number | string)[] {
  const totalNumbers = siblings * 2 + 5 // first, last, current, 2 dots
  if (totalPages <= totalNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const leftSibling = Math.max(current - siblings, 1)
  const rightSibling = Math.min(current + siblings, totalPages)
  const showLeftDots = leftSibling > 3
  const showRightDots = rightSibling < totalPages - 2

  if (!showLeftDots && showRightDots) {
    const leftCount = 3 + 2 * siblings
    return [...Array.from({ length: leftCount }, (_, i) => i + 1), DOTS, totalPages - 1, totalPages]
  }
  if (showLeftDots && !showRightDots) {
    const rightCount = 3 + 2 * siblings
    return [1, 2, DOTS, ...Array.from({ length: rightCount }, (_, i) => totalPages - rightCount + 1 + i)]
  }
  return [
    1,
    DOTS,
    ...Array.from({ length: rightSibling - leftSibling + 1 }, (_, i) => leftSibling + i),
    DOTS,
    totalPages,
  ]
}

export default function Pagination({
  page,
  pageSize,
  total,
  unit = 'kết quả',
  summary,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const pages = getRange(page, totalPages)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-1">
      {summary ? (
        <p className="text-sm text-gray-600">{summary}</p>
      ) : (
        <p className="text-sm text-gray-600">
          Hiển thị <span className="font-semibold text-gray-900">{from}</span> -{' '}
          <span className="font-semibold text-gray-900">{to}</span> trong tổng số{' '}
          <span className="font-semibold text-gray-900">{formatNumber(total)}</span> {unit}
        </p>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Trang trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((p, idx) =>
          p === DOTS ? (
            <span key={`dots-${idx}`} className="flex h-9 w-9 items-center justify-center text-gray-400">
              {DOTS}
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition ${
                p === page
                  ? 'bg-brand text-white shadow-sm'
                  : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Trang sau"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
