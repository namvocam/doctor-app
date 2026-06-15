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
import { formatNumber } from '@/lib/format'
import { COST_INPUT_FIELDS } from '@/lib/leadReport'

/** Các ô số thô từ API (18 ô kế toán nhập). */
const RAW_FIELDS = COST_INPUT_FIELDS

/** Số liệu tổng (chỉ gồm số). Dòng ngày dùng ReportRow (có thêm `date`). */
type Metrics = Record<string, number>
interface ReportRow {
  date: string
  [key: string]: number | string
}
/** Kiểu tham số cho hàm tính: nhận cả ReportRow lẫn Metrics. */
type M = Record<string, unknown>

const EMPTY_METRICS: Metrics = {}
for (const k of RAW_FIELDS) EMPTY_METRICS[k] = 0

/* ---- Format & công thức ---- */
const g = (m: M, k: string): number => {
  const v = m[k]
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}
// 0 -> '0 ₫' (không hiện '-'), khớp data mẫu hiển thị 0đ
const money = (n: number) => `${Math.round(n).toLocaleString('vi-VN')} ₫`
const num = (n: number) => formatNumber(n)
// Làm tròn tối đa 2 chữ số thập phân, bỏ số 0 thừa: 25.00->25, 87.10->87.1
const pct = (a: number, b: number) => (b > 0 ? `${parseFloat(((a / b) * 100).toFixed(2))}%` : '0%')
const div = (a: number, b: number) => (b > 0 ? a / b : 0)

// Các cột tự tính (theo công thức ID)
const totalCost = (m: M) => g(m, 'groupCost') + g(m, 'budget') + g(m, 'roomCostND') // 7 = 8+9+11
const depositAndService = (m: M) =>
  g(m, 'newCustomerAtSite') - g(m, 'failAtSite') + g(m, 'failReclose') // 24.1 = 24-26+26.1
const surgeryOldMonth = (m: M) => g(m, 'surgeryCount') - g(m, 'surgeryDepositThisMonth') // 25.2 = 25-25.1
const bookCumulative = (m: M) => g(m, 'bookTN') + g(m, 'bookOldData') // 21 = 19+20

/** Hàm tính giá trị hiển thị cho từng cột (áp dụng cho cả dòng ngày lẫn TỔNG). */
const VALUE: Record<string, (m: M) => React.ReactNode> = {
  revenue: (m) => money(g(m, 'revenue')), // 1
  totalCost: (m) => money(totalCost(m)), // 7 = 8+9+11
  groupCost: (m) => money(g(m, 'groupCost')), // 8
  budget: (m) => money(g(m, 'budget')), // 9
  costRevenueRatio: (m) => pct(totalCost(m), g(m, 'revenue')), // 2 = 7/1
  closeRate: (m) => pct(depositAndService(m), g(m, 'totalPhone')), // 3 = (24-26+26.1)/13
  realPassRate: (m) => pct(g(m, 'newCustomerAtSite'), g(m, 'totalPhone')), // 4 = 24/13
  bookRateTN: (m) => pct(g(m, 'bookTN'), g(m, 'totalPhone')), // 5 = 19/13
  bookRateCumulative: (m) => pct(bookCumulative(m), g(m, 'totalPhone')), // 6 = 21/13
  avgInvoicePerServiceCustomer: (m) => money(div(g(m, 'revenue'), g(m, 'surgeryCount'))), // 6.1 = 1/25
  roomCostND: (m) => money(g(m, 'roomCostND')), // 11 (nhập)
  messData: (m) => num(g(m, 'messData')), // 12a
  messSpam: (m) => num(g(m, 'messSpam')), // 12b
  totalPhone: (m) => num(g(m, 'totalPhone')), // 13
  phoneReached: (m) => num(g(m, 'phoneReached')), // 14
  reachRate: (m) => pct(g(m, 'phoneReached'), g(m, 'totalPhone')), // 15 = 14/13
  costPerMess: (m) => money(div(totalCost(m), g(m, 'messData'))), // 16 = 7/12a
  costPerPhone: (m) => money(div(totalCost(m), g(m, 'totalPhone'))), // 17 = 7/13
  phoneAskRate: (m) => pct(g(m, 'totalPhone'), g(m, 'messData')), // 18 = 13/12a
  bookTN: (m) => num(g(m, 'bookTN')), // 19
  bookOldData: (m) => num(g(m, 'bookOldData')), // 20
  bookCumulative: (m) => num(bookCumulative(m)), // 21 = 19+20
  bookRedirect: (m) => num(g(m, 'bookRedirect')), // 21.1
  costPerBookTN: (m) => money(div(totalCost(m), g(m, 'bookTN'))), // 22 = 7/19
  costPerBookCumulative: (m) => money(div(totalCost(m), bookCumulative(m))), // 23 = 7/21
  newCustomerAtSite: (m) => num(g(m, 'newCustomerAtSite')), // 24
  depositAndService: (m) => num(depositAndService(m)), // 24.1 = 24-26+26.1
  surgeryCount: (m) => num(g(m, 'surgeryCount')), // 25 (nhập)
  surgeryDepositThisMonth: (m) => num(g(m, 'surgeryDepositThisMonth')), // 25.1
  surgeryDepositOldMonth: (m) => num(surgeryOldMonth(m)), // 25.2 = 25-25.1
  failAtSite: (m) => num(g(m, 'failAtSite')), // 26 (nhập)
  failReclose: (m) => num(g(m, 'failReclose')), // 26.1
  failDoctorReject: (m) => num(g(m, 'failDoctorReject')), // 27 (nhập)
  failRateAtSite: (m) => pct(g(m, 'failAtSite') - g(m, 'failReclose'), g(m, 'newCustomerAtSite')), // 28 = (26-26.1)/24
  realPassPerCloseRate: (m) => pct(g(m, 'newCustomerAtSite'), bookCumulative(m)), // 29 = 24/21
  mktCostPerCustomerToSite: (m) => money(div(totalCost(m), g(m, 'newCustomerAtSite'))), // 30 = 7/24
  mktCostPerCustomerService: (m) => money(div(totalCost(m), depositAndService(m))), // 31 = 7/24.1
  invoicePerVisit: (m) => money(div(g(m, 'revenue'), g(m, 'newCustomerAtSite'))), // 32 = 1/24
  hardReachData1: (m) => num(g(m, 'hardReachData1')), // 33
  hardReachRate: (m) => pct(g(m, 'hardReachData1'), g(m, 'totalPhone')), // 34 = 33/13
}

/** Thứ tự & nhãn 40 cột dữ liệu (ngoài STT & Ngày nhập). */
const COL_DEFS: { key: string; label: string }[] = [
  { key: 'revenue', label: 'Doanh thu' },
  { key: 'totalCost', label: 'Tổng chi phí' },
  { key: 'groupCost', label: 'Chi phí thuê group' },
  { key: 'budget', label: 'Ngân sách' },
  { key: 'costRevenueRatio', label: 'Tổng chi phí / Doanh thu (%)' },
  { key: 'closeRate', label: 'Tỷ lệ chốt tổng' },
  { key: 'realPassRate', label: 'Tỉ lệ khách thực qua / SĐT (%)' },
  { key: 'bookRateTN', label: 'Tỉ lệ đặt lịch TN (%)' },
  { key: 'bookRateCumulative', label: 'Tỉ lệ đặt lịch lũy kế' },
  { key: 'avgInvoicePerServiceCustomer', label: 'Hóa đơn TB/Khách làm dịch vụ' },
  { key: 'roomCostND', label: 'Chi phí phòng ND' },
  { key: 'messData', label: 'Mess data' },
  { key: 'messSpam', label: 'Mess rác' },
  { key: 'totalPhone', label: 'Tổng SĐT' },
  { key: 'phoneReached', label: 'Tổng SĐT tiếp cận' },
  { key: 'reachRate', label: 'Tỷ lệ tiếp cận (%)' },
  { key: 'costPerMess', label: 'Chi phí / mess' },
  { key: 'costPerPhone', label: 'Chi phí / Số' },
  { key: 'phoneAskRate', label: 'Tỉ lệ xin số (%)' },
  { key: 'bookTN', label: 'Lịch đặt TN' },
  { key: 'bookOldData', label: 'Lịch đặt từ data cũ' },
  { key: 'bookCumulative', label: 'Lịch đặt lũy kế' },
  { key: 'bookRedirect', label: 'Lịch đặt điều hướng' },
  { key: 'costPerBookTN', label: 'Chi phí / lịch đặt TN' },
  { key: 'costPerBookCumulative', label: 'Chi phí / lịch lũy kế' },
  { key: 'newCustomerAtSite', label: 'Khách mới qua cơ sở' },
  { key: 'depositAndService', label: 'Khách cọc và SDDV' },
  { key: 'surgeryCount', label: 'Số ca mổ' },
  { key: 'surgeryDepositThisMonth', label: 'Số ca mổ cọc trong tháng' },
  { key: 'surgeryDepositOldMonth', label: 'Số ca mổ cọc tháng cũ' },
  { key: 'failAtSite', label: 'Khách fail tại cơ sở' },
  { key: 'failReclose', label: 'Khách fail chốt lại' },
  { key: 'failDoctorReject', label: 'Ca fail bác sĩ từ chối' },
  { key: 'failRateAtSite', label: 'Tỉ lệ fail tại CS (%)' },
  { key: 'realPassPerCloseRate', label: 'Tỉ lệ khách thực qua / Lịch chốt (%)' },
  { key: 'mktCostPerCustomerToSite', label: 'Chi phí marketing cho mỗi KH đến CS' },
  { key: 'mktCostPerCustomerService', label: 'Chi phí marketing cho mỗi KH đến CS và thưc hiện DV' },
  { key: 'invoicePerVisit', label: 'Hóa đơn / Khách đến' },
  { key: 'hardReachData1', label: 'Số data lần 1 khó tiếp cận' },
  { key: 'hardReachRate', label: 'Tỉ lệ data khó tiếp cận (%)' },
]

/** Cột tiền (căn phải). Các cột số & % căn giữa. */
const MONEY_COLS: ReadonlySet<string> = new Set([
  'revenue',
  'totalCost',
  'groupCost',
  'budget',
  'roomCostND',
  'avgInvoicePerServiceCustomer',
  'costPerMess',
  'costPerPhone',
  'costPerBookTN',
  'costPerBookCumulative',
  'mktCostPerCustomerToSite',
  'mktCostPerCustomerService',
  'invoicePerVisit',
])

interface ReportColumn {
  key: string
  label: string
  value: (m: M) => React.ReactNode
  align: string
}

const COLUMNS: ReportColumn[] = COL_DEFS.map((c) => ({
  key: c.key,
  label: c.label,
  value: VALUE[c.key] ?? (() => '-'),
  align: MONEY_COLS.has(c.key) ? 'text-right' : 'text-center',
}))

function defaultVisible(): Record<string, boolean> {
  return Object.fromEntries(COLUMNS.map((c) => [c.key, true]))
}

export default function LeadReport({ role, title }: { role: string; title: string }) {
  const [rows, setRows] = useState<ReportRow[]>([])
  const [totals, setTotals] = useState<Metrics>(EMPTY_METRICS)
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
        setTotals(json.totals ?? EMPTY_METRICS)
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
        {loading ? (
          <div className="rounded-xl bg-white p-16 text-center shadow-sm ring-1 ring-gray-100">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-gray-300" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-white px-6 py-20 text-center shadow-sm ring-1 ring-gray-100">
            <Search className="h-9 w-9 text-gray-700" />
            <p className="mt-4 text-base font-semibold text-gray-800">Không có dữ liệu</p>
            <p className="mt-1 text-sm text-gray-500">
              Vui lòng điều chỉnh bộ lọc để tìm kiếm báo cáo phù hợp.
            </p>
          </div>
        ) : (
          <>
            {/* Thống kê nhanh */}
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand">
                <BarChart3 className="h-4 w-4" /> Thống kê nhanh
              </h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                <Stat label="Doanh thu" value={money(g(totals, 'revenue'))} valueClass="text-gray-900" />
                <Stat label="Tổng chi phí" value={money(totalCost(totals))} valueClass="text-red-600" />
                <Stat label="Ngân sách" value={money(g(totals, 'budget'))} valueClass="text-amber-600" />
                <Stat label="Tổng chi phí / doanh thu" value={pct(totalCost(totals), g(totals, 'revenue'))} valueClass="text-teal-600" />
                <Stat label="Tỷ lệ chốt tổng" value={pct(depositAndService(totals), g(totals, 'totalPhone'))} valueClass="text-green-600" />
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
                    <th className="sticky left-0 z-30 h-28 w-16 bg-brand-navy px-3 align-middle">STT</th>
                    <th className="sticky left-16 z-30 h-28 min-w-[112px] whitespace-nowrap border-r border-white/15 bg-brand-navy px-3 align-middle">
                      Ngày nhập
                    </th>
                    {visibleColumns.map((c) => (
                      <Th key={c.key}>{c.label}</Th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Dòng TỔNG */}
                  <tr className="border-b border-gray-200 bg-gray-50 font-semibold text-gray-800">
                    <td className="sticky left-0 z-20 w-16 bg-gray-50 px-3 py-3 text-center">TỔNG</td>
                    <td className="sticky left-16 z-20 min-w-[112px] border-r border-gray-200 bg-gray-50 px-3 py-3" />
                    {visibleColumns.map((c) => (
                      <Td key={c.key} className={c.align}>
                        {c.value(totals)}
                      </Td>
                    ))}
                  </tr>
                  {rows.map((r, i) => (
                    <tr key={r.date} className="group border-b border-gray-100 hover:bg-gray-50">
                      <td className="sticky left-0 z-20 w-16 bg-white px-3 py-3 text-center group-hover:bg-gray-50">
                        {i + 1}
                      </td>
                      <td className="sticky left-16 z-20 min-w-[112px] whitespace-nowrap border-r border-gray-200 bg-white px-3 py-3 text-center group-hover:bg-gray-50">
                        {r.date}
                      </td>
                      {visibleColumns.map((c) => (
                        <Td key={c.key} className={c.align}>
                          {c.value(r)}
                        </Td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
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
  return <th className="h-28 min-w-[90px] whitespace-normal px-3 align-middle">{children}</th>
}
function Td({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-3 ${className}`}>{children}</td>
}
