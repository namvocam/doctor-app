'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
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
} from 'lucide-react'
import { formatDateTimeVN, formatNumber, maskPhone } from '@/lib/format'
import { exportCSV } from '@/lib/csv'

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
  highlight?: boolean
}

function AppointmentsClient() {
  const searchParams = useSearchParams()
  const view = searchParams.get('view') ?? ''

  const [filters, setFilters] = useState({
    q: '',
    province: 'all',
    service: '',
    from: '',
    to: '',
  })
  const [showFilter, setShowFilter] = useState(true)
  const [maskPhones, setMaskPhones] = useState(false)
  const [rows, setRows] = useState<Appointment[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const buildQuery = useCallback(
    (f: typeof filters) => {
      const p = new URLSearchParams()
      if (view) p.set('view', view)
      if (f.q) p.set('q', f.q)
      if (f.province !== 'all') p.set('province', f.province)
      if (f.service) p.set('service', f.service)
      if (f.from) p.set('from', f.from)
      if (f.to) p.set('to', f.to)
      p.set('limit', '50')
      return p.toString()
    },
    [view]
  )

  const fetchData = useCallback(
    async (f: typeof filters) => {
      setLoading(true)
      try {
        const res = await fetch(`/api/appointments?${buildQuery(f)}`)
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    fetchData(filters)
  }
  function handleReset() {
    const cleared = { q: '', province: 'all', service: '', from: '', to: '' }
    setFilters(cleared)
    fetchData(cleared)
  }

  function handleExport() {
    const headers = [
      'STT', 'Tên KH', 'Ngày giờ thực hiện', 'Bác sĩ', 'Phẫu thuật',
      'Số ĐT', 'Địa chỉ', 'Dịch vụ 1', 'Dịch vụ 2', 'Xét nghiệm', 'Ghi chú',
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
    ])
    exportCSV('lich-hen.csv', headers, data)
  }

  const title = useMemo(
    () => (view === 'today' ? 'Lịch hẹn hôm nay (theo tháng)' : 'Lịch hẹn'),
    [view]
  )

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
            <Field label="Tỉnh">
              <select
                value={filters.province}
                onChange={(e) => setFilters({ ...filters, province: e.target.value })}
                className="input"
              >
                <option value="all">Tất cả tỉnh</option>
                <option value="Hà Nội">Hà Nội</option>
                <option value="Sài Gòn">Sài Gòn</option>
                <option value="Khác">Khác</option>
              </select>
            </Field>
            <Field label="Dịch vụ">
              <input
                value={filters.service}
                onChange={(e) => setFilters({ ...filters, service: e.target.value })}
                placeholder="Nhập tên dịch vụ"
                className="input"
              />
            </Field>
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

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          Đã tìm thấy <span className="font-bold text-gray-900">{formatNumber(total)}</span> lịch hẹn.
        </p>
        <div className="flex items-center gap-2">
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
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-100 scrollbar-thin">
        <table className="min-w-[1100px] w-full text-sm">
          <thead>
            <tr className="bg-brand-navy text-left text-xs font-semibold uppercase text-white">
              <Th>Thao tác</Th>
              <Th>STT</Th>
              <Th>Tên KH</Th>
              <Th>Ngày giờ thực hiện</Th>
              <Th>Bác sĩ</Th>
              <Th>Phẫu thuật</Th>
              <Th>Số ĐT/Hộ chiếu</Th>
              <Th>Địa chỉ</Th>
              <Th>Dịch vụ 1</Th>
              <Th>Dịch vụ 2</Th>
              <Th>Xét nghiệm</Th>
              <Th>Ghi chú của telesale</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-gray-400">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-gray-400">
                  Không có lịch hẹn nào.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
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
                  <Td>{i + 1}</Td>
                  <Td className="font-medium">
                    {r.customerName}
                    {r.age ? ` / ${r.age} tuổi` : ''}
                  </Td>
                  <Td>{formatDateTimeVN(r.performAt)}</Td>
                  <Td>{r.doctor ?? '-'}</Td>
                  <Td className="text-center">{r.surgery ? <Check className="mx-auto h-4 w-4" /> : '-'}</Td>
                  <Td>{maskPhones ? maskPhone(r.phone) : r.phone ?? '-'}</Td>
                  <Td>{r.address ?? '-'}</Td>
                  <Td>{r.service1 ?? '-'}</Td>
                  <Td>{r.service2 || '-'}</Td>
                  <Td className="text-center">{r.test ? <Check className="mx-auto h-4 w-4" /> : '-'}</Td>
                  <Td className="max-w-xs">
                    <span className="line-clamp-2">{r.telesaleNote ?? '-'}</span>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
function Th({ children }: { children: React.ReactNode }) {
  return <th className="whitespace-nowrap px-3 py-3">{children}</th>
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
