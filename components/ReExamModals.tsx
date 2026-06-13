'use client'

import { useState } from 'react'
import { Loader2, Check } from 'lucide-react'
import Modal from '@/components/Modal'
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
          <button onClick={onClose} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Huỷ
          </button>
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Lưu
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <F label="Khách hàng"><input className="input" value={v('customerName')} onChange={(e) => set('customerName', e.target.value)} /></F>
        <F label="Số điện thoại"><input className="input" value={v('phone')} onChange={(e) => set('phone', e.target.value)} /></F>
        <F label="Ngày tái khám"><input type="date" className="input" value={v('reExamDate')} onChange={(e) => set('reExamDate', e.target.value)} /></F>
        <F label="Giờ tái khám"><input type="time" className="input" value={v('time')} onChange={(e) => set('time', e.target.value)} /></F>
        <F label="Trạng thái">
          <select className="input" value={v('status')} onChange={(e) => set('status', e.target.value)}>
            {REEXAM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </F>
        <F label="Ngày PT"><input type="date" className="input" value={v('surgeryDate')} onChange={(e) => set('surgeryDate', e.target.value)} /></F>
        <F label="Dịch vụ" full><input className="input" value={v('service')} onChange={(e) => set('service', e.target.value)} /></F>
        <F label="Bác sĩ"><input className="input" value={v('doctor')} onChange={(e) => set('doctor', e.target.value)} /></F>
        <F label="Sale 1"><input className="input" value={v('sale1')} onChange={(e) => set('sale1', e.target.value)} /></F>
        <F label="Tình trạng trước khám" full><textarea className="input min-h-16" value={v('preExamCondition')} onChange={(e) => set('preExamCondition', e.target.value)} /></F>
        <F label="Chỉ định của bác sĩ" full><textarea className="input min-h-16" value={v('doctorInstruction')} onChange={(e) => set('doctorInstruction', e.target.value)} /></F>
        <F label="Ghi chú" full><textarea className="input min-h-16" value={v('note')} onChange={(e) => set('note', e.target.value)} /></F>
      </div>
    </Modal>
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
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Lưu
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

function F({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  )
}
