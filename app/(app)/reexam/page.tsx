'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  CalendarCheck2,
  SlidersHorizontal,
  Search,
  RotateCcw,
  Plus,
  FileDown,
  CalendarDays,
  Clock,
  TriangleAlert,
  Wifi,
  MessageSquare,
  Bandage,
  Ban,
  Pencil,
  Camera,
  Trash2,
  Loader2,
  type LucideIcon,
} from 'lucide-react'
import { formatDateVN, formatNumber, maskPhone } from '@/lib/format'
import { exportCSV } from '@/lib/csv'
import Pagination from '@/components/Pagination'
import EmptyState from '@/components/EmptyState'
import CreateReExamModal from '@/components/CreateReExamModal'
import ActionMenu from '@/components/ActionMenu'
import ReExamModals, { type ReExamRecord } from '@/components/ReExamModals'
import { REEXAM_STATUSES, REEXAM_STATUS_STYLE } from '@/lib/reexamStatus'

const PAGE_SIZE = 14

interface ReExam {
  _id: string
  customerName: string
  phone?: string
  reExamDate: string
  time?: string
  status?: string
  service?: string
  surgeryDate?: string
  media?: string
  doctor?: string
  sale1?: string
}

function rowTint(status?: string) {
  return REEXAM_STATUS_STYLE[status ?? '']?.row ?? 'hover:bg-gray-50'
}

// Box thống kê theo trạng thái (icon + màu) - khớp ảnh thiết kế
const STATUS_BOXES: { status: string; icon: LucideIcon; color: string; bg: string }[] = [
  { status: 'Sắp tới', icon: Clock, color: 'text-slate-600', bg: 'bg-slate-100' },
  { status: 'Quá hạn', icon: TriangleAlert, color: 'text-red-600', bg: 'bg-red-100' },
  { status: 'Online', icon: Wifi, color: 'text-amber-600', bg: 'bg-amber-100' },
  { status: 'Phàn nàn', icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-100' },
  { status: 'Xử lý vết thương', icon: Bandage, color: 'text-orange-600', bg: 'bg-orange-100' },
  { status: 'Đã huỷ', icon: Ban, color: 'text-gray-500', bg: 'bg-gray-200' },
]

const QUICK_RANGES = [
  'Hôm nay', 'Hôm qua', 'Ngày mai', 'Tuần này', 'Tuần trước', 'Tháng này', 'Tháng trước', '30 ngày',
]

function toISO(d: Date) {
  return d.toISOString().slice(0, 10)
}

function ReExamClient() {
  const searchParams = useSearchParams()
  const view = searchParams.get('view') ?? ''

  const [filters, setFilters] = useState({
    doctor: '',
    status: '',
    name: '',
    phone: '',
    service: '',
    from: '',
    to: '',
  })
  const [showFilter, setShowFilter] = useState(false) // mặc định thu gọn bộ lọc
  const [maskPhones, setMaskPhones] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<ReExamRecord | null>(null)
  const [mediaRec, setMediaRec] = useState<ReExamRecord | null>(null)
  const [deleting, setDeleting] = useState<ReExamRecord | null>(null)
  const [rows, setRows] = useState<ReExam[]>([])
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const buildQuery = useCallback(
    (f: typeof filters, pageArg: number) => {
      const p = new URLSearchParams()
      if (view) p.set('view', view)
      if (f.doctor) p.set('doctor', f.doctor)
      if (f.status) p.set('status', f.status)
      if (f.name) p.set('name', f.name)
      if (f.phone) p.set('phone', f.phone)
      if (f.service) p.set('service', f.service)
      if (f.from) p.set('from', f.from)
      if (f.to) p.set('to', f.to)
      p.set('page', String(pageArg))
      p.set('limit', String(PAGE_SIZE))
      return p.toString()
    },
    [view]
  )

  const fetchData = useCallback(
    async (f: typeof filters, pageArg: number) => {
      setLoading(true)
      try {
        const res = await fetch(`/api/reexams?${buildQuery(f, pageArg)}`)
        const json = await res.json()
        setRows(json.data ?? [])
        setStatusCounts(json.statusCounts ?? {})
        setTotal(json.total ?? 0)
      } finally {
        setLoading(false)
      }
    },
    [buildQuery]
  )

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setPage(1)
    fetchData(filters, 1)
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    fetchData(filters, 1)
  }
  function handleReset() {
    const cleared = { doctor: '', status: '', name: '', phone: '', service: '', from: '', to: '' }
    setFilters(cleared)
    setPage(1)
    fetchData(cleared, 1)
  }
  function handlePageChange(p: number) {
    setPage(p)
    fetchData(filters, p)
  }

  function applyQuickRange(label: string) {
    const today = new Date()
    let from = new Date(today)
    let to = new Date(today)
    switch (label) {
      case 'Hôm qua': from.setDate(today.getDate() - 1); to.setDate(today.getDate() - 1); break
      case 'Ngày mai': from.setDate(today.getDate() + 1); to.setDate(today.getDate() + 1); break
      case 'Tuần này': from.setDate(today.getDate() - today.getDay() + 1); break
      case 'Tuần trước': from.setDate(today.getDate() - today.getDay() - 6); to.setDate(today.getDate() - today.getDay()); break
      case 'Tháng này': from = new Date(today.getFullYear(), today.getMonth(), 1); break
      case 'Tháng trước': from = new Date(today.getFullYear(), today.getMonth() - 1, 1); to = new Date(today.getFullYear(), today.getMonth(), 0); break
      case '30 ngày': from.setDate(today.getDate() - 30); break
    }
    const next = { ...filters, from: toISO(from), to: toISO(to) }
    setFilters(next)
    setPage(1)
    fetchData(next, 1)
  }

  function handleExport() {
    const headers = ['STT', 'Khách hàng', 'Số điện thoại', 'Ngày tái khám', 'Giờ', 'Trạng thái', 'Dịch vụ', 'Ngày PT', 'Media', 'Bác sĩ', 'Sale 1']
    const data = rows.map((r, i) => [
      i + 1, r.customerName, maskPhones ? maskPhone(r.phone) : r.phone ?? '',
      formatDateVN(r.reExamDate), r.time ?? '', r.status ?? '', r.service ?? '',
      formatDateVN(r.surgeryDate), r.media ?? '', r.doctor ?? '', r.sale1 ?? '',
    ])
    exportCSV('tai-kham.csv', headers, data)
  }

  const activeFilterCount = Object.values(filters).filter((v) => v).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-800">
          <CalendarCheck2 className="h-6 w-6 text-brand" />
          {view === 'today' ? 'Tái khám hôm nay' : 'Quản lý Tái khám'}
        </h1>
        <div className="flex items-center gap-2">
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
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <Plus className="h-4 w-4" /> Tạo lịch tái khám
          </button>
        </div>
      </div>

      {/* Filter */}
      {showFilter && (
        <form onSubmit={handleSearch} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Bác sĩ">
              <input value={filters.doctor} onChange={(e) => setFilters({ ...filters, doctor: e.target.value })} placeholder="Chọn bác sĩ" className="input" />
            </Field>
            <Field label="Trạng thái">
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="input">
                <option value="">Tất cả</option>
                {REEXAM_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Từ ngày">
              <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} className="input" />
            </Field>
            <Field label="Đến ngày">
              <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} className="input" />
            </Field>
            <Field label="Tên khách hàng">
              <input value={filters.name} onChange={(e) => setFilters({ ...filters, name: e.target.value })} placeholder="Nhập tên khách hàng" className="input" />
            </Field>
            <Field label="Số điện thoại">
              <input value={filters.phone} onChange={(e) => setFilters({ ...filters, phone: e.target.value })} placeholder="Nhập số điện thoại" className="input" />
            </Field>
            <Field label="Dịch vụ">
              <input value={filters.service} onChange={(e) => setFilters({ ...filters, service: e.target.value })} placeholder="Nhập tên dịch vụ" className="input" />
            </Field>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={handleReset} className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              <RotateCcw className="h-4 w-4" /> Đặt lại
            </button>
            <button type="submit" className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
              <Search className="h-4 w-4" /> Tìm kiếm
            </button>
          </div>
        </form>
      )}

      {/* Quick ranges */}
      <div className="flex flex-wrap gap-2">
        {QUICK_RANGES.map((r) => (
          <button
            key={r}
            onClick={() => applyQuickRange(r)}
            className="rounded-lg border border-brand/30 bg-white px-3 py-1.5 text-sm text-brand transition hover:bg-brand hover:text-white"
          >
            {r}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <StatCard icon={<CalendarDays className="h-5 w-5" />} label="Tổng tái khám" value={total} color="text-brand" bg="bg-brand/10" />
        {STATUS_BOXES.map((b) => (
          <StatCard
            key={b.status}
            icon={<b.icon className="h-5 w-5" />}
            label={b.status}
            value={statusCounts[b.status] ?? 0}
            color={b.color}
            bg={b.bg}
          />
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          <span className="font-bold text-gray-900">{formatNumber(total)}</span> kết quả
        </p>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700">
            <FileDown className="h-4 w-4" /> Xuất CSV
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={maskPhones} onChange={(e) => setMaskPhones(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand" />
            Che SĐT
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-100 scrollbar-thin">
        {loading ? (
          <div className="flex justify-center py-16 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState />
        ) : (
        <table className="min-w-[1100px] w-full text-sm">
          <thead>
            <tr className="bg-brand-navy text-left text-xs font-semibold uppercase text-white">
              <Th>Thao tác</Th><Th>STT</Th><Th>Khách hàng</Th><Th>Số điện thoại</Th>
              <Th>Ngày tái khám</Th><Th>Giờ</Th><Th>Trạng thái</Th><Th>Dịch vụ</Th>
              <Th>Ngày PT</Th><Th>Media</Th><Th>Bác sĩ</Th><Th>Sale 1</Th>
            </tr>
          </thead>
          <tbody>
            {
              rows.map((r, i) => (
                <tr key={r._id} className={`border-b border-gray-100 ${rowTint(r.status)}`}>
                  <Td>
                    <ActionMenu
                      items={[
                        { label: 'Sửa', icon: Pencil, onClick: () => setEditing(r) },
                        { label: 'Media', icon: Camera, onClick: () => setMediaRec(r) },
                        { label: 'Xoá', icon: Trash2, danger: true, onClick: () => setDeleting(r) },
                      ]}
                    />
                  </Td>
                  <Td>{(page - 1) * PAGE_SIZE + i + 1}</Td>
                  <Td className="font-medium">{r.customerName}</Td>
                  <Td>{maskPhones ? maskPhone(r.phone) : r.phone ?? '-'}</Td>
                  <Td className="font-medium text-brand">{formatDateVN(r.reExamDate)}</Td>
                  <Td className="text-brand">{r.time ?? '-'}</Td>
                  <Td>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${REEXAM_STATUS_STYLE[r.status ?? '']?.pill ?? 'bg-gray-100 text-gray-600'}`}>
                      {r.status ?? '-'}
                    </span>
                  </Td>
                  <td className="min-w-[160px] max-w-xs px-3 py-3 align-top">
                    <ExpandableCell
                      text={r.service}
                      expanded={!!expandedRows[r._id]}
                      onToggle={() =>
                        setExpandedRows((prev) => ({ ...prev, [r._id]: !prev[r._id] }))
                      }
                    />
                  </td>
                  <Td>{formatDateVN(r.surgeryDate)}</Td>
                  <Td>{r.media ?? '-'}</Td>
                  <Td>{r.doctor ?? '-'}</Td>
                  <Td>{r.sale1 ?? '-'}</Td>
                </tr>
              ))
            }
          </tbody>
        </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          unit="lịch tái khám"
          onPageChange={handlePageChange}
        />
      )}

      <CreateReExamModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => fetchData(filters, 1)}
      />

      <ReExamModals
        editing={editing}
        media={mediaRec}
        deleting={deleting}
        onClose={() => {
          setEditing(null)
          setMediaRec(null)
          setDeleting(null)
        }}
        onChanged={() => fetchData(filters, page)}
      />
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

/** Ô có thể dài: cố định 2 dòng, hiện "Xem thêm" để mở rộng nếu dài. */
function ExpandableCell({
  text,
  expanded,
  onToggle,
}: {
  text?: string
  expanded: boolean
  onToggle: () => void
}) {
  const t = text || '-'
  const isLong = t.length > 40
  return (
    <div className="w-48">
      <p className={`break-words ${expanded ? 'whitespace-pre-wrap' : 'line-clamp-2'}`}>{t}</p>
      {isLong && (
        <button
          onClick={onToggle}
          className="mt-0.5 block text-xs font-medium text-brand hover:underline"
        >
          {expanded ? 'Thu gọn' : 'Xem thêm'}
        </button>
      )}
    </div>
  )
}
function StatCard({ icon, label, value, color, bg }: { icon: React.ReactNode; label: string; value: number; color: string; bg: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${bg} ${color}`}>{icon}</span>
      <div>
        <p className={`text-2xl font-bold ${color}`}>{formatNumber(value)}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="whitespace-nowrap px-3 py-3">{children}</th>
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`whitespace-nowrap px-3 py-3 align-middle ${className}`}>{children}</td>
}

export default function ReExamPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">Đang tải...</div>}>
      <ReExamClient />
    </Suspense>
  )
}
