'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  CalendarPlus,
  X,
  Search,
  User,
  Phone,
  Scissors,
  ChevronLeft,
  Save,
  Loader2,
  Activity,
  ClipboardList,
  StickyNote,
  Info,
  Calendar,
  Clock,
} from 'lucide-react'
import { formatDateVN } from '@/lib/format'

const STATUSES = ['Đã lên lịch', 'Đã tái khám', 'Quá hạn', 'Phàn nàn', 'Đã huỷ']

interface Customer {
  phone: string
  customerName: string
  age?: number
  surgeryCount: number
}
interface Surgery {
  _id: string
  service1: string
  service2: string
  performAt: string
  doctor: string
  reExamCount: number
}

function defaultReExamDate() {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function surgeryLabel(s: Surgery) {
  return [s.service1 && `Dịch vụ mổ: ${s.service1}`, s.service2 && `Khác: ${s.service2}`]
    .filter(Boolean)
    .join(' | ')
}

export default function CreateReExamModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const [step, setStep] = useState(1)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [surgery, setSurgery] = useState<Surgery | null>(null)

  // Step 1
  const [q, setQ] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  // Step 2
  const [surgeries, setSurgeries] = useState<Surgery[]>([])
  const [loadingSurgeries, setLoadingSurgeries] = useState(false)
  // Step 3
  const [form, setForm] = useState({
    reExamDate: defaultReExamDate(),
    time: '09:00',
    preExamCondition: '',
    doctorInstruction: '',
    note: '',
    status: 'Đã lên lịch',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const searchCustomers = useCallback(async (query: string) => {
    setLoadingCustomers(true)
    try {
      const res = await fetch(`/api/customers?q=${encodeURIComponent(query)}`)
      const json = await res.json()
      setCustomers(json.data ?? [])
    } finally {
      setLoadingCustomers(false)
    }
  }, [])

  // Reset & nạp danh sách khi mở
  useEffect(() => {
    if (!open) return
    /* eslint-disable react-hooks/set-state-in-effect */
    setStep(1)
    setCustomer(null)
    setSurgery(null)
    setQ('')
    setForm({
      reExamDate: defaultReExamDate(),
      time: '09:00',
      preExamCondition: '',
      doctorInstruction: '',
      note: '',
      status: 'Đã lên lịch',
    })
    setError('')
    /* eslint-enable react-hooks/set-state-in-effect */
    searchCustomers('')
  }, [open, searchCustomers])

  async function selectCustomer(c: Customer) {
    setCustomer(c)
    setStep(2)
    setLoadingSurgeries(true)
    try {
      const res = await fetch(`/api/customers/surgeries?phone=${encodeURIComponent(c.phone)}`)
      const json = await res.json()
      setSurgeries(json.data ?? [])
    } finally {
      setLoadingSurgeries(false)
    }
  }

  function selectSurgery(s: Surgery) {
    setSurgery(s)
    setStep(3)
  }

  async function save() {
    if (!customer || !surgery) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/reexams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customer.customerName,
          phone: customer.phone,
          appointmentId: surgery._id,
          surgeryDate: surgery.performAt,
          service: surgeryLabel(surgery),
          doctor: surgery.doctor,
          reExamDate: form.reExamDate,
          time: form.time,
          status: form.status,
          preExamCondition: form.preExamCondition,
          doctorInstruction: form.doctorInstruction,
          note: form.note,
        }),
      })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error ?? 'Lưu thất bại')
        return
      }
      onCreated()
      onClose()
    } catch {
      setError('Không thể kết nối máy chủ')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 my-6 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header xanh */}
        <div className="flex items-center justify-between bg-green-600 px-5 py-4 text-white">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <CalendarPlus className="h-5 w-5" /> Tạo lịch tái khám mới
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-white/20" aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 px-6 py-5">
          <StepDot n={1} label="Tìm khách hàng" step={step} />
          <Connector done={step > 1} />
          <StepDot n={2} label="Chọn phẫu thuật" step={step} />
          <Connector done={step > 2} />
          <StepDot n={3} label="Thông tin tái khám" step={step} />
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 pb-6 scrollbar-thin">
          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <Search className="h-4 w-4" /> Tìm kiếm khách hàng{' '}
                <span className="font-normal text-gray-400">(Nhập tên hoặc số điện thoại)</span>
              </label>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  searchCustomers(q)
                }}
                className="flex gap-2"
              >
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Nhập tên hoặc SĐT..."
                  className="input flex-1"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Search className="h-4 w-4" /> Tìm
                </button>
              </form>

              <h3 className="mb-2 mt-5 flex items-center gap-2 font-semibold text-gray-800">
                <User className="h-5 w-5" /> Kết quả tìm kiếm
              </h3>
              {loadingCustomers ? (
                <div className="flex justify-center py-8 text-gray-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : customers.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">Không tìm thấy khách hàng.</p>
              ) : (
                <div className="space-y-2">
                  {customers.map((c) => (
                    <button
                      key={c.phone}
                      onClick={() => selectCustomer(c)}
                      className="block w-full rounded-xl border border-gray-200 p-3 text-left transition hover:border-green-400 hover:bg-green-50/40"
                    >
                      <p className="flex items-center gap-1.5 font-semibold text-gray-800">
                        <User className="h-4 w-4 text-gray-400" />
                        {c.customerName}
                        {c.age ? ` (${c.age} tuổi)` : ''}
                      </p>
                      <p className="mt-0.5 flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" /> {c.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Scissors className="h-3.5 w-3.5" /> {c.surgeryCount} phẫu thuật
                        </span>
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && customer && (
            <div>
              <div className="rounded-xl border-l-4 border-green-500 bg-green-50/60 p-4">
                <p className="flex items-center gap-1.5 font-semibold text-gray-800">
                  <User className="h-4 w-4 text-green-600" /> Khách hàng:{' '}
                  <span className="text-green-700">{customer.customerName}</span>
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
                  <Phone className="h-4 w-4" /> {customer.phone}
                  {customer.age ? ` (${customer.age} tuổi)` : ''}
                </p>
                <button
                  onClick={() => setStep(1)}
                  className="mt-3 flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" /> Chọn khách hàng khác
                </button>
              </div>

              <h3 className="mb-2 mt-5 flex items-center gap-2 font-semibold text-gray-800">
                <Scissors className="h-5 w-5" /> Chọn phẫu thuật
              </h3>
              {loadingSurgeries ? (
                <div className="flex justify-center py-8 text-gray-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : surgeries.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">Khách hàng chưa có ca phẫu thuật.</p>
              ) : (
                <div className="space-y-2">
                  {surgeries.map((s) => (
                    <button
                      key={s._id}
                      onClick={() => selectSurgery(s)}
                      className="block w-full rounded-xl border border-gray-200 p-3 text-left transition hover:border-green-400 hover:bg-green-50/40"
                    >
                      <p className="flex items-center gap-1.5 font-semibold text-gray-800">
                        <Scissors className="h-4 w-4 text-gray-400" /> {surgeryLabel(s) || 'Phẫu thuật'}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500">
                        <Calendar className="h-3.5 w-3.5" /> Ngày PT: {formatDateVN(s.performAt)}
                        {s.doctor ? ` | ${s.doctor}` : ''}
                      </p>
                      <span className="mt-2 inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                        Đã có {s.reExamCount} lịch tái khám
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && surgery && (
            <div>
              <div className="rounded-xl border-l-4 border-green-500 bg-green-50/60 p-4">
                <p className="flex items-center gap-1.5 font-semibold text-gray-800">
                  <Scissors className="h-4 w-4 text-green-600" /> Phẫu thuật:{' '}
                  <span className="text-green-700">{surgeryLabel(surgery) || 'Phẫu thuật'}</span>
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" /> Ngày PT: {formatDateVN(surgery.performAt)}
                  {surgery.doctor ? ` | Bác sĩ: ${surgery.doctor}` : ''}
                </p>
                <button
                  onClick={() => setStep(2)}
                  className="mt-3 flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" /> Chọn phẫu thuật khác
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <Calendar className="h-4 w-4" /> Ngày tái khám <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.reExamDate}
                    onChange={(e) => setForm({ ...form, reExamDate: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <Clock className="h-4 w-4" /> Giờ tái khám <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  <Activity className="h-4 w-4" /> Tình trạng trước khám
                </label>
                <textarea
                  value={form.preExamCondition}
                  onChange={(e) => setForm({ ...form, preExamCondition: e.target.value })}
                  placeholder="Mô tả tình trạng của khách hàng trước khi tái khám..."
                  className="input min-h-20"
                />
              </div>
              <div className="mt-4">
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  <ClipboardList className="h-4 w-4" /> Chỉ định của bác sĩ
                </label>
                <textarea
                  value={form.doctorInstruction}
                  onChange={(e) => setForm({ ...form, doctorInstruction: e.target.value })}
                  placeholder="Chỉ định điều trị, thuốc, chế độ chăm sóc..."
                  className="input min-h-20"
                />
              </div>
              <div className="mt-4">
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  <StickyNote className="h-4 w-4" /> Ghi chú
                </label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Ghi chú khác..."
                  className="input min-h-16"
                />
              </div>
              <div className="mt-4">
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  <Info className="h-4 w-4" /> Trạng thái
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="input"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                {error && <span className="mr-auto text-sm text-red-600">{error}</span>}
                <button
                  onClick={save}
                  disabled={saving || !form.reExamDate || !form.time}
                  className="flex items-center gap-1.5 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Lưu lịch tái khám
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StepDot({ n, label, step }: { n: number; label: string; step: number }) {
  const active = step === n
  const done = step > n
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition ${
          active || done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
        }`}
      >
        {n}
      </span>
      <span className={`text-xs ${active ? 'font-semibold text-green-600' : 'text-gray-400'}`}>
        {label}
      </span>
    </div>
  )
}
function Connector({ done }: { done: boolean }) {
  return <div className={`h-0.5 w-10 sm:w-20 ${done ? 'bg-green-500' : 'bg-gray-200'}`} />
}
