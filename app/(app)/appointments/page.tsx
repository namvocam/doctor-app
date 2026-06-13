'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  CalendarClock,
  SlidersHorizontal,
  Search,
  RotateCcw,
  FileDown,
  Check,
  MoreVertical,
  Loader2,
  Columns3,
  Maximize2,
  Minimize2,
  ChevronDown,
  ClipboardList,
  Wallet,
  AlertCircle,
  Ban,
  Scissors,
  CalendarX2,
  CalendarCheck2,
  Clock,
  CircleDot,
  type LucideIcon,
} from 'lucide-react'
import {
  formatDateTimeVN,
  formatDateVN,
  formatNumber,
  formatCurrency,
  maskPhone,
} from '@/lib/format'
import { exportCSV } from '@/lib/csv'
import Pagination from '@/components/Pagination'
import DayPagination from '@/components/DayPagination'
import EmptyState from '@/components/EmptyState'
import { CATEGORY_LABELS, CATEGORY_ALL_LABELS, type CategoryType } from '@/lib/categories'

const PAGE_SIZE = 14

interface Appointment {
  _id: string
  customerName: string
  age?: number
  phone?: string
  performAt: string
  doctor?: string
  surgery?: boolean
  address?: string
  province?: string
  service1?: string
  service2?: string
  test?: boolean
  telesaleNote?: string
  source?: string
  subSource?: string
  groupSource?: string
  telesale?: string
  telesaleCtv?: string
  sale1?: string
  sale2?: string
  result?: string
  saleNote?: string
  media?: string
  mktNote?: string
  dataReceivedAt?: string
  createdAt?: string
  recording?: string
  revenue?: number
  highlight?: boolean
}

interface ColumnCtx {
  maskPhones: boolean
  expanded: boolean
  onToggleExpand: () => void
}

interface ColumnDef {
  key: string
  label: string
  thClass?: string
  tdClass?: string
  render: (r: Appointment, ctx: ColumnCtx) => React.ReactNode
}

/** Ô ghi chú: cố định 2 dòng, hiện "Xem thêm" để mở rộng cả hàng nếu dài. */
function NoteCell({ text, ctx }: { text?: string; ctx: ColumnCtx }) {
  const t = text || '-'
  const isLong = t.length > 60
  return (
    <div>
      <span className={ctx.expanded ? 'whitespace-pre-wrap' : 'line-clamp-2'}>{t}</span>
      {isLong && (
        <button
          onClick={ctx.onToggleExpand}
          className="mt-0.5 block text-xs font-medium text-brand hover:underline"
        >
          {ctx.expanded ? 'Thu gọn' : 'Xem thêm'}
        </button>
      )}
    </div>
  )
}

/** Các cột có thể ẩn/hiện (Thao tác & STT luôn hiển thị). */
const COLUMNS: ColumnDef[] = [
  {
    key: 'customerName',
    label: 'Tên KH',
    tdClass: 'font-medium',
    render: (r) => `${r.customerName}${r.age ? ` / ${r.age} tuổi` : ''}`,
  },
  { key: 'performAt', label: 'Ngày giờ thực hiện', tdClass: 'whitespace-nowrap', render: (r) => formatDateTimeVN(r.performAt) },
  { key: 'doctor', label: 'Bác sĩ', tdClass: 'whitespace-nowrap', render: (r) => r.doctor ?? '-' },
  {
    key: 'surgery',
    label: 'Phẫu thuật',
    thClass: 'text-center',
    tdClass: 'text-center',
    render: (r) => (r.surgery ? <Check className="mx-auto h-4 w-4" /> : '-'),
  },
  {
    key: 'phone',
    label: 'Số ĐT/Hộ chiếu',
    tdClass: 'whitespace-nowrap',
    render: (r, c) => (c.maskPhones ? maskPhone(r.phone) : r.phone ?? '-'),
  },
  { key: 'address', label: 'Địa chỉ', render: (r) => r.address ?? '-' },
  { key: 'service1', label: 'Dịch vụ 1', render: (r) => r.service1 ?? '-' },
  { key: 'service2', label: 'Dịch vụ 2', render: (r) => r.service2 || '-' },
  {
    key: 'test',
    label: 'Xét nghiệm',
    thClass: 'text-center',
    tdClass: 'text-center',
    render: (r) => (r.test ? <Check className="mx-auto h-4 w-4" /> : '-'),
  },
  {
    key: 'telesaleNote',
    label: 'Ghi chú của Telesale',
    tdClass: 'min-w-[200px] max-w-xs',
    render: (r, ctx) => <NoteCell text={r.telesaleNote} ctx={ctx} />,
  },
  { key: 'source', label: 'Nguồn', render: (r) => r.source ?? '-' },
  { key: 'subSource', label: 'Nguồn phụ', render: (r) => r.subSource || '-' },
  { key: 'groupSource', label: 'Nguồn gr tiếp cận sau', render: (r) => r.groupSource || '-' },
  { key: 'telesale', label: 'Telesale', tdClass: 'whitespace-nowrap', render: (r) => r.telesale || '-' },
  { key: 'telesaleCtv', label: 'Telesale CTV', tdClass: 'whitespace-nowrap', render: (r) => r.telesaleCtv || '-' },
  { key: 'sale1', label: 'Sale 1', tdClass: 'whitespace-nowrap', render: (r) => r.sale1 || '-' },
  { key: 'sale2', label: 'Sale 2', tdClass: 'whitespace-nowrap', render: (r) => r.sale2 || '-' },
  { key: 'result', label: 'Kết quả', render: (r) => r.result ?? '-' },
  {
    key: 'saleNote',
    label: 'Ghi chú của sale',
    tdClass: 'min-w-[180px] max-w-xs',
    render: (r, ctx) => <NoteCell text={r.saleNote} ctx={ctx} />,
  },
  { key: 'media', label: 'Media', render: (r) => r.media || '-' },
  {
    key: 'mktNote',
    label: 'Ghi chú của MKT',
    tdClass: 'min-w-[180px] max-w-xs',
    render: (r, ctx) => <NoteCell text={r.mktNote} ctx={ctx} />,
  },
  { key: 'dataReceivedAt', label: 'Ngày nhận data', tdClass: 'whitespace-nowrap', render: (r) => formatDateVN(r.dataReceivedAt) },
  { key: 'createdAt', label: 'Ngày tạo lịch', tdClass: 'whitespace-nowrap', render: (r) => formatDateVN(r.createdAt) },
  {
    key: 'recording',
    label: 'Ghi âm',
    render: (r) => (r.recording ? <audio controls src={r.recording} className="h-8 w-40" /> : '-'),
  },
  {
    key: 'revenue',
    label: 'Doanh Thu',
    tdClass: 'whitespace-nowrap',
    render: (r) => (
      <span className={`font-semibold ${r.highlight ? '' : 'text-green-600'}`}>
        {formatCurrency(r.revenue)}
      </span>
    ),
  },
]

function defaultVisible(): Record<string, boolean> {
  return Object.fromEntries(COLUMNS.map((c) => [c.key, true]))
}

/** Tháng hiện tại dạng "YYYY-MM" cho input type=month. */
function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Số ngày trong tháng "YYYY-MM". */
function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number)
  if (!y || !m) return 31
  return new Date(y, m, 0).getDate()
}

/** Ngày mặc định khi mở tháng: hôm nay nếu là tháng hiện tại, ngược lại là ngày 1. */
function defaultDayFor(month: string): number {
  return month === currentMonth() ? new Date().getDate() : 1
}

function AppointmentsClient() {
  const searchParams = useSearchParams()
  const view = searchParams.get('view') ?? ''
  const isToday = view === 'today' // chế độ "Hôm nay (theo tháng)": phân trang theo ngày

  const [filters, setFilters] = useState({
    q: '',
    age: '',
    province: '',
    service: '',
    quote: '',
    source: '',
    result: '',
    from: '',
    to: '',
  })
  const [month, setMonth] = useState(currentMonth) // YYYY-MM, dùng cho chế độ "theo tháng"
  const [showFilter, setShowFilter] = useState(false) // mặc định thu gọn bộ lọc
  const [maskPhones, setMaskPhones] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [rows, setRows] = useState<Appointment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [cats, setCats] = useState<Record<string, { label: string; options: string[] }>>({})

  // Ẩn/hiện cột + fullscreen
  const [visible, setVisible] = useState<Record<string, boolean>>(defaultVisible)
  const [showCols, setShowCols] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const colRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (colRef.current && !colRef.current.contains(e.target as Node)) setShowCols(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Tải danh mục lọc (admin cấu hình)
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((j) => setCats(j.data ?? {}))
      .catch(() => {})
  }, [])

  const visibleColumns = useMemo(() => COLUMNS.filter((c) => visible[c.key]), [visible])

  const buildQuery = useCallback(
    (f: typeof filters, pageArg: number, monthArg: string) => {
      const p = new URLSearchParams()
      if (f.q) p.set('q', f.q)
      if (f.age) p.set('age', f.age)
      if (f.province) p.set('province', f.province)
      if (f.service) p.set('service', f.service)
      if (f.quote) p.set('quote', f.quote)
      if (f.source) p.set('source', f.source)
      if (f.result) p.set('result', f.result)

      if (isToday) {
        // pageArg = ngày trong tháng; lấy toàn bộ lịch hẹn của riêng ngày đó
        const [y, mo] = monthArg.split('-').map(Number)
        p.set('from', new Date(y, mo - 1, pageArg, 0, 0, 0, 0).toISOString())
        p.set('to', new Date(y, mo - 1, pageArg, 23, 59, 59, 999).toISOString())
        p.set('page', '1')
        p.set('limit', '200')
      } else {
        if (f.from) p.set('from', new Date(`${f.from}T00:00:00`).toISOString())
        if (f.to) p.set('to', new Date(`${f.to}T23:59:59.999`).toISOString())
        p.set('page', String(pageArg))
        p.set('limit', String(PAGE_SIZE))
      }
      return p.toString()
    },
    [isToday]
  )

  const fetchData = useCallback(
    async (f: typeof filters, pageArg: number, monthArg: string) => {
      setLoading(true)
      try {
        const res = await fetch(`/api/appointments?${buildQuery(f, pageArg, monthArg)}`)
        const json = await res.json()
        setRows(json.data ?? [])
        setTotal(json.total ?? 0)
      } finally {
        setLoading(false)
      }
    },
    [buildQuery]
  )

  // Tải lại khi đổi view (từ sidebar)
  useEffect(() => {
    const m = currentMonth()
    const initialPage = isToday ? defaultDayFor(m) : 1
    /* eslint-disable react-hooks/set-state-in-effect */
    setMonth(m)
    setPage(initialPage)
    fetchData(filters, initialPage, m)
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const p = isToday ? page : 1 // chế độ theo tháng: giữ nguyên ngày đang chọn
    setPage(p)
    fetchData(filters, p, month)
  }
  const EMPTY_FILTERS = {
    q: '', age: '', province: '', service: '', quote: '', source: '', result: '', from: '', to: '',
  }
  function handleReset() {
    // Chỉ xoá các input bộ lọc; KHÔNG gọi API (phải bấm "Tìm kiếm" mới lấy kết quả)
    setFilters(EMPTY_FILTERS)
  }
  function handleResetAndSearch() {
    // Đặt lại bộ lọc và tìm kiếm lại ngay (dùng cho nút trong trạng thái rỗng)
    setFilters(EMPTY_FILTERS)
    setPage(1)
    fetchData(EMPTY_FILTERS, 1, month)
  }
  function handlePageChange(p: number) {
    setPage(p)
    fetchData(filters, p, month)
  }
  function handleMonthChange(m: string) {
    const day = defaultDayFor(m)
    setMonth(m)
    setPage(day)
    fetchData(filters, day, m)
  }

  function handleExport() {
    const headers = [
      'STT', 'Tên KH', 'Ngày giờ thực hiện', 'Bác sĩ', 'Phẫu thuật',
      'Số ĐT/Hộ chiếu', 'Địa chỉ', 'Dịch vụ 1', 'Dịch vụ 2', 'Xét nghiệm',
      'Ghi chú của Telesale', 'Nguồn', 'Nguồn phụ', 'Nguồn gr tiếp cận sau',
      'Telesale', 'Telesale CTV', 'Sale 1', 'Sale 2', 'Kết quả',
      'Ghi chú của sale', 'Media', 'Ghi chú của MKT', 'Ngày nhận data',
      'Ngày tạo lịch', 'Ghi âm', 'Doanh Thu',
    ]
    const data = rows.map((r, i) => [
      i + 1,
      `${r.customerName}${r.age ? ` / ${r.age} tuổi` : ''}`,
      formatDateTimeVN(r.performAt),
      r.doctor ?? '',
      r.surgery ? 'Có' : 'Không',
      maskPhones ? maskPhone(r.phone) : r.phone ?? '',
      r.address ?? '',
      r.service1 ?? '',
      r.service2 ?? '',
      r.test ? 'Có' : 'Không',
      r.telesaleNote ?? '',
      r.source ?? '',
      r.subSource ?? '',
      r.groupSource ?? '',
      r.telesale ?? '',
      r.telesaleCtv ?? '',
      r.sale1 ?? '',
      r.sale2 ?? '',
      r.result ?? '',
      r.saleNote ?? '',
      r.media ?? '',
      r.mktNote ?? '',
      formatDateVN(r.dataReceivedAt),
      formatDateVN(r.createdAt),
      r.recording ?? '',
      r.revenue ? String(r.revenue) : '0',
    ])
    exportCSV('lich-hen.csv', headers, data)
  }

  const title = useMemo(
    () => (view === 'today' ? 'Danh sách Lịch hẹn theo ngày' : 'Lịch hẹn'),
    [view]
  )

  // Đếm số trường bộ lọc đang có giá trị; chế độ "theo tháng" tính thêm ô "Tháng thực hiện"
  const activeFilterCount =
    Object.values(filters).filter((v) => v).length + (isToday ? 1 : 0)

  // Thống kê theo kết quả của ngày đang chọn (chế độ "theo tháng")
  const statusCounts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const r of rows) {
      const k = r.result || 'Khác'
      m[k] = (m[k] || 0) + 1
    }
    return m
  }, [rows])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-800">
          <CalendarClock className="h-6 w-6 text-brand" /> {title}
        </h1>
        <button
          onClick={() => setShowFilter((v) => !v)}
          className="flex items-center gap-2 rounded-lg border border-brand/30 bg-white px-3 py-2 text-sm font-medium text-brand transition hover:bg-brand/5"
        >
          <SlidersHorizontal className="h-4 w-4" /> Bộ lọc
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilter && (
        <form
          onSubmit={handleSearch}
          className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Khách hàng">
              <input
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                placeholder="Nhập SĐT, tên KH để tìm kiếm"
                className="input"
              />
            </Field>
            <Field label={CATEGORY_LABELS.age}>
              <CatSelect type="age" value={filters.age} cats={cats} onChange={(v) => setFilters({ ...filters, age: v })} />
            </Field>
            <Field label={CATEGORY_LABELS.province}>
              <CatSelect type="province" value={filters.province} cats={cats} onChange={(v) => setFilters({ ...filters, province: v })} />
            </Field>
            <Field label={CATEGORY_LABELS.service}>
              <CatSelect type="service" value={filters.service} cats={cats} onChange={(v) => setFilters({ ...filters, service: v })} />
            </Field>
            <Field label={CATEGORY_LABELS.quote}>
              <CatSelect type="quote" value={filters.quote} cats={cats} onChange={(v) => setFilters({ ...filters, quote: v })} />
            </Field>
            <Field label={CATEGORY_LABELS.source}>
              <CatSelect type="source" value={filters.source} cats={cats} onChange={(v) => setFilters({ ...filters, source: v })} />
            </Field>
            <Field label={CATEGORY_LABELS.result}>
              <CatSelect type="result" value={filters.result} cats={cats} onChange={(v) => setFilters({ ...filters, result: v })} />
            </Field>
            {isToday ? (
              <Field label="Tháng thực hiện">
                <input
                  type="month"
                  value={month}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="input"
                />
              </Field>
            ) : (
              <>
                <Field label="Từ ngày">
                  <input
                    type="date"
                    value={filters.from}
                    onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                    className="input"
                  />
                </Field>
                <Field label="Đến ngày">
                  <input
                    type="date"
                    value={filters.to}
                    onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                    className="input"
                  />
                </Field>
              </>
            )}
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

      {/* Vùng kết quả (có thể fullscreen) */}
      <div
        className={
          fullscreen
            ? 'fixed inset-0 z-50 flex flex-col gap-3 overflow-hidden bg-gray-100 p-4'
            : 'space-y-4'
        }
      >
        {/* Box thống kê theo kết quả của ngày đang chọn (chế độ "theo tháng") */}
        {isToday && !loading && (
          <div className="flex flex-wrap gap-3">
            <StatusBox
              icon={ClipboardList}
              count={total}
              label="Tổng lịch hẹn"
              color="text-brand"
              bg="bg-brand/10"
            />
            {(cats.result?.options ?? Object.keys(statusCounts))
              .filter((s) => statusCounts[s])
              .map((s) => {
                const meta = STATUS_META[s] ?? {
                  icon: CircleDot,
                  color: 'text-gray-500',
                  bg: 'bg-gray-100',
                }
                return (
                  <StatusBox
                    key={s}
                    icon={meta.icon}
                    count={statusCounts[s]}
                    label={meta.label ?? s}
                    color={meta.color}
                    bg={meta.bg}
                  />
                )
              })}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            {isToday && (
              <>
                Ngày{' '}
                <span className="font-bold text-gray-900">
                  {String(page).padStart(2, '0')}/{month.split('-').reverse().join('/')}
                </span>{' '}
                —{' '}
              </>
            )}
            Đã tìm thấy <span className="font-bold text-gray-900">{formatNumber(total)}</span> lịch hẹn.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFullscreen((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              {fullscreen ? 'Thoát' : 'Fullscreen'}
            </button>

            {/* Cột dropdown */}
            <div className="relative" ref={colRef}>
              <button
                onClick={() => setShowCols((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Columns3 className="h-4 w-4" /> Cột <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {showCols && (
                <div className="absolute right-0 top-11 z-50 w-72 rounded-xl border border-gray-100 bg-white p-3 shadow-lg">
                  <p className="mb-2 text-sm font-semibold text-gray-800">Ẩn/hiện &amp; chọn cột</p>
                  <div className="mb-2 flex gap-2">
                    <button
                      onClick={() => setVisible(defaultVisible())}
                      className="flex-1 rounded-lg bg-brand py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() =>
                        setVisible(Object.fromEntries(COLUMNS.map((c) => [c.key, false])))
                      }
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
                          onChange={() =>
                            setVisible((prev) => ({ ...prev, [c.key]: !prev[c.key] }))
                          }
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
              onClick={handleExport}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <FileDown className="h-4 w-4" /> Xuất CSV
            </button>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={maskPhones}
                onChange={(e) => setMaskPhones(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
              />
              Che số điện thoại
            </label>
          </div>
        </div>

        {/* Table */}
        <div
          className={`overflow-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-100 scrollbar-thin ${
            fullscreen ? 'flex-1' : ''
          }`}
        >
          {loading ? (
            <div className="flex justify-center py-16 text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            isToday ? (
              <EmptyState />
            ) : (
              <EmptyState
                icon={CalendarX2}
                message="Không tìm thấy lịch hẹn nào"
                description="Thử điều chỉnh bộ lọc để tìm kiếm kết quả khác"
                action={{ label: 'Đặt lại bộ lọc', onClick: handleResetAndSearch }}
              />
            )
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-navy text-left text-xs font-semibold uppercase text-white">
                  <Th>Thao tác</Th>
                  <Th>STT</Th>
                  {visibleColumns.map((c) => (
                    <Th key={c.key} className={c.thClass}>
                      {c.label}
                    </Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const ctx: ColumnCtx = {
                    maskPhones,
                    expanded: !!expandedRows[r._id],
                    onToggleExpand: () =>
                      setExpandedRows((prev) => ({ ...prev, [r._id]: !prev[r._id] })),
                  }
                  return (
                    <tr
                      key={r._id}
                      className={`border-b border-gray-100 ${
                        r.highlight ? 'bg-orange-400 text-white' : 'hover:bg-gray-50'
                      }`}
                    >
                      <Td>
                        <button className={r.highlight ? 'text-white' : 'text-gray-400'}>
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </Td>
                      <Td>{(isToday ? 0 : (page - 1) * PAGE_SIZE) + i + 1}</Td>
                      {visibleColumns.map((c) => (
                        <Td key={c.key} className={c.tdClass}>
                          {c.render(r, ctx)}
                        </Td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && isToday && (
          <DayPagination days={daysInMonth(month)} current={page} onChange={handlePageChange} />
        )}
        {!loading && !isToday && total > 0 && (
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            unit="lịch hẹn"
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  )
}

// Icon + màu + nhãn rút gọn cho từng kết quả (box thống kê theo ngày)
const STATUS_META: Record<string, { icon: LucideIcon; color: string; bg: string; label?: string }> = {
  'Đã đặt lịch': { icon: CalendarCheck2, color: 'text-blue-600', bg: 'bg-blue-50' },
  'Đã cọc': { icon: Wallet, color: 'text-teal-600', bg: 'bg-teal-50' },
  Failed: { icon: AlertCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
  'Bác sĩ từ chối': { icon: Ban, color: 'text-amber-600', bg: 'bg-amber-50', label: 'BS từ chối' },
  'Phẫu thuật': { icon: Scissors, color: 'text-orange-600', bg: 'bg-orange-50' },
  'Hủy lịch': { icon: CalendarX2, color: 'text-gray-500', bg: 'bg-gray-100' },
  'Hoãn mổ': { icon: Clock, color: 'text-slate-600', bg: 'bg-slate-100' },
}

function StatusBox({
  icon: Icon,
  count,
  label,
  color,
  bg,
}: {
  icon: LucideIcon
  count: number
  label: string
  color: string
  bg: string
}) {
  return (
    <div className="flex min-w-[150px] items-center gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100">
      <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg} ${color}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className={`text-xl font-bold ${color}`}>{formatNumber(count)}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  )
}

function CatSelect({
  type,
  value,
  cats,
  onChange,
}: {
  type: CategoryType
  value: string
  cats: Record<string, { label: string; options: string[] }>
  onChange: (v: string) => void
}) {
  const options = cats[type]?.options ?? []
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input">
      <option value="">{CATEGORY_ALL_LABELS[type]}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}
function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`whitespace-nowrap px-3 py-3 ${className}`}>{children}</th>
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-3 align-top ${className}`}>{children}</td>
}

export default function AppointmentsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">Đang tải...</div>}>
      <AppointmentsClient />
    </Suspense>
  )
}
