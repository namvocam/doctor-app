'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BarChart3,
  SlidersHorizontal,
  Search,
  RotateCcw,
  Columns3,
  Maximize2,
  Minimize2,
  ChevronDown,
  Loader2,
} from 'lucide-react'
import { formatCurrency } from '@/lib/format'

interface ReportRow {
  date: string
  revenue: number
  count: number
}

/** Cột dữ liệu (ngoài STT & Ngày nhập). Chỉ "Doanh thu" có số liệu thật,
 *  các cột chi phí/tỷ lệ là placeholder 0đ/0% (chưa có dữ liệu chi phí). */
interface ReportColumn {
  key: string
  label: string
  render: (row: ReportRow) => React.ReactNode
  totalRender: (total: number) => React.ReactNode
}

const COLUMNS: ReportColumn[] = [
  { key: 'revenue', label: 'Doanh thu', render: (r) => formatCurrency(r.revenue), totalRender: (t) => formatCurrency(t) },
  { key: 'totalCost', label: 'Tổng chi phí', render: () => '0đ', totalRender: () => '0đ' },
  { key: 'groupCost', label: 'Chi phí thuê group', render: () => '0đ', totalRender: () => '0đ' },
  { key: 'budget', label: 'Ngân sách', render: () => '0đ', totalRender: () => '0đ' },
  { key: 'costRevenueRatio', label: 'Tổng chi phí / Doanh thu (%)', render: () => '0%', totalRender: () => '0%' },
  { key: 'closeRate', label: 'Tỷ lệ chốt tổng', render: () => '0%', totalRender: () => '0%' },
  { key: 'realPassRate', label: 'Tỉ lệ khách thực qua / SĐT (%)', render: () => '0%', totalRender: () => '0%' },
  { key: 'bookRateTN', label: 'Tỉ lệ đặt lịch TN (%)', render: () => '0%', totalRender: () => '0%' },
  { key: 'bookRateCumulative', label: 'Tỉ lệ đặt lịch lũy kế (%)', render: () => '0%', totalRender: () => '0%' },
]

function defaultVisible(): Record<string, boolean> {
  return Object.fromEntries(COLUMNS.map((c) => [c.key, true]))
}

export default function LeadReport({ role, title }: { role: string; title: string }) {
  const [rows, setRows] = useState<ReportRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ from: '', to: '' })

  const [showFilter, setShowFilter] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [visible, setVisible] = useState<Record<string, boolean>>(defaultVisible)
  const [showCols, setShowCols] = useState(false)
  const colRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (colRef.current && !colRef.current.contains(e.target as Node)) setShowCols(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const visibleColumns = useMemo(() => COLUMNS.filter((c) => visible[c.key]), [visible])

  const fetchData = useCallback(
    async (f: typeof filters) => {
      setLoading(true)
      try {
        const p = new URLSearchParams({ role })
        if (f.from) p.set('from', f.from)
        if (f.to) p.set('to', f.to)
        const res = await fetch(`/api/lead-report?${p.toString()}`)
        const json = await res.json()
        setRows(json.rows ?? [])
        setTotal(json.total ?? 0)
      } finally {
        setLoading(false)
      }
    },
    [role]
  )

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    fetchData(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    fetchData(filters)
  }
  function handleReset() {
    const cleared = { from: '', to: '' }
    setFilters(cleared)
    fetchData(cleared)
  }

  const colCount = visibleColumns.length + 2 // STT + Ngày nhập

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-800">
          <BarChart3 className="h-6 w-6 text-brand" /> {title}
        </h1>
        <button
          onClick={() => setShowFilter((v) => !v)}
          className="flex items-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-dark"
        >
          <SlidersHorizontal className="h-4 w-4" /> Bộ lọc
        </button>
      </div>

      {/* Filter panel */}
      {showFilter && (
        <form onSubmit={handleSearch} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Từ ngày</label>
              <input
                type="date"
                value={filters.from}
                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Đến ngày</label>
              <input
                type="date"
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <RotateCcw className="h-4 w-4" /> Đặt lại
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
            >
              <Search className="h-4 w-4" /> Tìm kiếm
            </button>
          </div>
        </form>
      )}

      <div
        className={
          fullscreen
            ? 'fixed inset-0 z-50 flex flex-col gap-4 overflow-auto bg-gray-100 p-4'
            : 'space-y-4'
        }
      >
        {/* Thống kê nhanh */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand">
            <BarChart3 className="h-4 w-4" /> Thống kê nhanh
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <Stat label="Doanh thu" value={formatCurrency(total)} valueClass="text-gray-900" />
            <Stat label="Tổng chi phí" value="0đ" valueClass="text-red-600" />
            <Stat label="Ngân sách ads" value="0đ" valueClass="text-amber-600" />
            <Stat label="Tổng chi phí / doanh thu" value="0%" valueClass="text-teal-600" />
            <Stat label="Tỷ lệ chốt tổng" value="0%" valueClass="text-green-600" />
            <Stat label="Tỷ lệ đặt lịch" value="0%" valueClass="text-blue-600" />
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative" ref={colRef}>
            <button
              onClick={() => setShowCols((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Columns3 className="h-4 w-4" /> Ẩn/Hiện cột <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {showCols && (
              <div className="absolute left-0 top-11 z-50 w-72 rounded-xl border border-gray-100 bg-white p-3 shadow-lg">
                <div className="mb-2 flex gap-2">
                  <button
                    onClick={() => setVisible(defaultVisible())}
                    className="flex-1 rounded-lg bg-brand py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => setVisible(Object.fromEntries(COLUMNS.map((c) => [c.key, false])))}
                    className="flex-1 rounded-lg border border-gray-300 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Bỏ hết
                  </button>
                </div>
                <div className="max-h-72 space-y-0.5 overflow-y-auto scrollbar-thin pr-1">
                  {COLUMNS.map((c) => (
                    <label
                      key={c.key}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={!!visible[c.key]}
                        onChange={() => setVisible((prev) => ({ ...prev, [c.key]: !prev[c.key] }))}
                        className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setFullscreen((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {fullscreen ? 'Thoát' : 'Fullscreen'}
          </button>
        </div>

        {/* Table */}
        <div
          className={`overflow-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-100 scrollbar-thin ${
            fullscreen ? 'flex-1' : ''
          }`}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-navy text-center text-xs font-semibold uppercase text-white">
                <Th>STT</Th>
                <Th>Ngày nhập</Th>
                {visibleColumns.map((c) => (
                  <Th key={c.key}>{c.label}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={colCount} className="py-12 text-center text-gray-400">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </td>
                </tr>
              ) : (
                <>
                  {/* Dòng TỔNG */}
                  <tr className="border-b border-gray-200 bg-gray-50 font-semibold text-gray-800">
                    <Td className="text-center">TỔNG</Td>
                    <Td />
                    {visibleColumns.map((c) => (
                      <Td key={c.key} className="text-center">
                        {c.totalRender(total)}
                      </Td>
                    ))}
                  </tr>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={colCount} className="py-10 text-center text-gray-400">
                        Không có dữ liệu doanh thu.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, i) => (
                      <tr key={r.date} className="border-b border-gray-100 hover:bg-gray-50">
                        <Td className="text-center">{i + 1}</Td>
                        <Td className="whitespace-nowrap text-center">{r.date}</Td>
                        {visibleColumns.map((c) => (
                          <Td key={c.key} className="text-center">
                            {c.render(r)}
                          </Td>
                        ))}
                      </tr>
                    ))
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, valueClass }: { label: string; value: string; valueClass: string }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}
function Th({ children }: { children?: React.ReactNode }) {
  return <th className="whitespace-nowrap px-3 py-3">{children}</th>
}
function Td({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-3 ${className}`}>{children}</td>
}
