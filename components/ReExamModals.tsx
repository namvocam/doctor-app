'use client'

import { useState } from 'react'
import {
  Loader2,
  Save,
  ChevronLeft,
  User,
  Pencil,
  Calendar,
  Clock,
  Activity,
  ClipboardList,
  StickyNote,
} from 'lucide-react'
import Modal from '@/components/Modal'
import { formatDateVN } from '@/lib/format'
import { REEXAM_STATUSES } from '@/lib/reexamStatus'

export interface ReExamRecord {
  _id: string
  customerName: string
  phone?: string
  reExamDate?: string
  time?: string
  status?: string
  service?: string
  surgeryDate?: string
  media?: string
  doctor?: string
  sale1?: string
  preExamCondition?: string
  doctorInstruction?: string
  note?: string
}

interface Props {
  editing: ReExamRecord | null
  media: ReExamRecord | null
  deleting: ReExamRecord | null
  onClose: () => void
  onChanged: () => void
}

export default function ReExamModals({ editing, media, deleting, onClose, onChanged }: Props) {
  return (
    <>
      <EditModal record={editing} onClose={onClose} onSaved={onChanged} />
      <MediaModal record={media} onClose={onClose} onSaved={onChanged} />
      <DeleteModal record={deleting} onClose={onClose} onDeleted={onChanged} />
    </>
  )
}

function toDateInput(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

async function putReExam(id: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/reexams/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const j = await res.json()
    throw new Error(j.error ?? 'Cập nhật thất bại')
  }
}

/* ---------------- Edit ---------------- */
function EditModal({
  record,
  onClose,
  onSaved,
}: {
  record: ReExamRecord | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<Record<string, unknown>>({})
  const [initId, setInitId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (record && record._id !== initId) {
    setInitId(record._id)
    setForm({
      ...record,
      reExamDate: toDateInput(record.reExamDate),
      surgeryDate: toDateInput(record.surgeryDate),
    })
    setError('')
  }

  const v = (k: string) => (form[k] as string) ?? ''
  const set = (k: string, val: unknown) => setForm((p) => ({ ...p, [k]: val }))

  async function save() {
    if (!record) return
    setSaving(true)
    setError('')
    try {
      await putReExam(record._id, form)
      onSaved()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={!!record}
      title="Sửa lịch tái khám"
      onClose={onClose}
      size="lg"
      footer={
        <>
          {error && <span className="mr-auto self-center text-sm text-red-600">{error}</span>}
          <button onClick={onClose} className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <ChevronLeft className="h-4 w-4" /> Quay lại
          </button>
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Lưu thay đổi
          </button>
        </>
      }
    >
      {/* Phần 1: Thông tin khách hàng (chỉ đọc) */}
      <div className="-mx-5 -mt-4 mb-4 bg-gray-100 px-5 py-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <User className="h-4 w-4" /> Thông tin Khách hàng
        </h3>
      </div>
      <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
        <Info label="Khách hàng" value={record?.customerName} />
        <Info label="Dịch vụ" value={record?.service} />
        <Info label="Số điện thoại" value={record?.phone} />
        <Info label="Bác sĩ" value={record?.doctor} />
        <Info label="Ngày phẫu thuật" value={formatDateVN(record?.surgeryDate)} />
        <Info label="Media" value={record?.media} />
      </div>

      {/* Phần 2: Sửa lịch tái khám (sửa được) */}
      <div className="-mx-5 mb-4 mt-5 bg-gray-100 px-5 py-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <Pencil className="h-4 w-4" /> Sửa Lịch tái khám
        </h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-6">
        <F label="Ngày tái khám" icon={Calendar} required span={2}>
          <input type="date" className="input" value={v('reExamDate')} onChange={(e) => set('reExamDate', e.target.value)} />
        </F>
        <F label="Giờ tái khám" icon={Clock} required span={2}>
          <input type="time" className="input" value={v('time')} onChange={(e) => set('time', e.target.value)} />
        </F>
        <F label="Trạng thái" span={2}>
          <select className="input" value={v('status')} onChange={(e) => set('status', e.target.value)}>
            {REEXAM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </F>
        <F label="Tình trạng trước khám" icon={Activity} span={3}>
          <textarea className="input min-h-24" value={v('preExamCondition')} onChange={(e) => set('preExamCondition', e.target.value)} placeholder="Mô tả tình trạng của khách hàng trước khi tái khám..." />
        </F>
        <F label="Chỉ định của bác sĩ" icon={ClipboardList} span={3}>
          <textarea className="input min-h-24" value={v('doctorInstruction')} onChange={(e) => set('doctorInstruction', e.target.value)} placeholder="Ghi chú chỉ định của bác sĩ..." />
        </F>
        <F label="Ghi chú" icon={StickyNote} span={6}>
          <textarea className="input min-h-20" value={v('note')} onChange={(e) => set('note', e.target.value)} placeholder="Ghi chú khác..." />
        </F>
      </div>
    </Modal>
  )
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <p className="text-sm text-gray-700">
      <span className="font-semibold">{label}:</span> {value || '-'}
    </p>
  )
}

/* ---------------- Media ---------------- */
function MediaModal({
  record,
  onClose,
  onSaved,
}: {
  record: ReExamRecord | null
  onClose: () => void
  onSaved: () => void
}) {
  const [value, setValue] = useState('')
  const [initId, setInitId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (record && record._id !== initId) {
    setInitId(record._id)
    setValue(record.media ?? '')
    setError('')
  }

  async function save() {
    if (!record) return
    setSaving(true)
    setError('')
    try {
      await putReExam(record._id, { media: value })
      onSaved()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={!!record}
      title="Media"
      onClose={onClose}
      size="sm"
      footer={
        <>
          {error && <span className="mr-auto self-center text-sm text-red-600">{error}</span>}
          <button onClick={onClose} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Huỷ
          </button>
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Lưu
          </button>
        </>
      }
    >
      <p className="mb-2 text-sm text-gray-600">
        Phụ trách Media cho khách <span className="font-semibold text-gray-900">{record?.customerName}</span>
      </p>
      <input
        className="input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Nhập tên/nhóm phụ trách Media..."
      />
    </Modal>
  )
}

/* ---------------- Delete ---------------- */
function DeleteModal({
  record,
  onClose,
  onDeleted,
}: {
  record: ReExamRecord | null
  onClose: () => void
  onDeleted: () => void
}) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function confirm() {
    if (!record) return
    setDeleting(true)
    setError('')
    try {
      const res = await fetch(`/api/reexams/${record._id}`, { method: 'DELETE' })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error ?? 'Xoá thất bại')
        return
      }
      onDeleted()
      onClose()
    } catch {
      setError('Không thể kết nối máy chủ')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal
      open={!!record}
      title="Xác nhận xoá"
      onClose={onClose}
      size="sm"
      footer={
        <>
          {error && <span className="mr-auto self-center text-sm text-red-600">{error}</span>}
          <button onClick={onClose} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Huỷ
          </button>
          <button onClick={confirm} disabled={deleting} className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />} Xoá
          </button>
        </>
      }
    >
      <p className="text-sm text-gray-600">
        Bạn có chắc chắn muốn xoá lịch tái khám của{' '}
        <span className="font-semibold text-gray-900">{record?.customerName}</span>? Hành động này không thể hoàn tác.
      </p>
    </Modal>
  )
}

const SPAN_CLASS: Record<number, string> = {
  2: 'sm:col-span-2',
  3: 'sm:col-span-3',
  6: 'sm:col-span-6',
}

function F({
  label,
  icon: Icon,
  required,
  span = 6,
  children,
}: {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  required?: boolean
  span?: number
  children: React.ReactNode
}) {
  return (
    <div className={SPAN_CLASS[span] ?? 'sm:col-span-6'}>
      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}
