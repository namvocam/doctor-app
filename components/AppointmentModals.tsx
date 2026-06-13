'use client'

import { useState } from 'react'
import { Loader2, Check } from 'lucide-react'
import Modal from '@/components/Modal'
import { formatDateTimeVN, formatDateVN, formatCurrency } from '@/lib/format'
import type { Appointment, CategoryMap } from '@/lib/appointmentTypes'

interface Props {
  viewing: Appointment | null
  editing: Appointment | null
  deleting: Appointment | null
  creating?: boolean
  cats: CategoryMap
  onClose: () => void
  onChanged: () => void
}

export default function AppointmentModals({
  viewing,
  editing,
  deleting,
  creating = false,
  cats,
  onClose,
  onChanged,
}: Props) {
  return (
    <>
      <ViewModal appointment={viewing} onClose={onClose} />
      <EditModal appointment={editing} cats={cats} onClose={onClose} onSaved={onChanged} />
      <DeleteModal appointment={deleting} onClose={onClose} onDeleted={onChanged} />
      <CreateModal open={creating} cats={cats} onClose={onClose} onCreated={onChanged} />
    </>
  )
}

/* ---------------- View ---------------- */
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 border-b border-gray-50 py-2">
      <span className="w-44 shrink-0 text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value || '-'}</span>
    </div>
  )
}

function ViewModal({ appointment: a, onClose }: { appointment: Appointment | null; onClose: () => void }) {
  return (
    <Modal open={!!a} title="Thông tin lịch hẹn" onClose={onClose} size="lg">
      {a && (
        <div className="grid gap-x-6 sm:grid-cols-2">
          <Row label="Tên KH" value={`${a.customerName}${a.age ? ` / ${a.age} tuổi` : ''}`} />
          <Row label="Số ĐT/Hộ chiếu" value={a.phone} />
          <Row label="Ngày giờ thực hiện" value={formatDateTimeVN(a.performAt)} />
          <Row label="Bác sĩ" value={a.doctor} />
          <Row label="Phẫu thuật" value={a.surgery ? 'Có' : 'Không'} />
          <Row label="Xét nghiệm" value={a.test ? 'Có' : 'Không'} />
          <Row label="Tỉnh" value={a.province} />
          <Row label="Địa chỉ" value={a.address} />
          <Row label="Dịch vụ 1" value={a.service1} />
          <Row label="Dịch vụ 2" value={a.service2} />
          <Row label="Nguồn" value={a.source} />
          <Row label="Nguồn phụ" value={a.subSource} />
          <Row label="Nguồn gr tiếp cận sau" value={a.groupSource} />
          <Row label="Telesale" value={a.telesale} />
          <Row label="Telesale CTV" value={a.telesaleCtv} />
          <Row label="Sale 1" value={a.sale1} />
          <Row label="Sale 2" value={a.sale2} />
          <Row label="Báo giá" value={a.quote} />
          <Row label="Kết quả" value={a.result} />
          <Row label="Media" value={a.media} />
          <Row label="Ngày nhận data" value={formatDateVN(a.dataReceivedAt)} />
          <Row label="Ngày tạo lịch" value={formatDateVN(a.createdAt)} />
          <Row label="Doanh thu" value={formatCurrency(a.revenue)} />
          <Row label="Ghi chú Telesale" value={a.telesaleNote} />
          <Row label="Ghi chú sale" value={a.saleNote} />
          <Row label="Ghi chú MKT" value={a.mktNote} />
        </div>
      )}
    </Modal>
  )
}

/* ---------------- Edit ---------------- */
function toLocalInput(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
function toDateInput(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function EditModal({
  appointment,
  cats,
  onClose,
  onSaved,
}: {
  appointment: Appointment | null
  cats: CategoryMap
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // Khởi tạo form mỗi khi mở một bản ghi mới
  const [initId, setInitId] = useState<string | null>(null)
  if (appointment && appointment._id !== initId) {
    setInitId(appointment._id)
    setForm({
      ...appointment,
      performAt: toLocalInput(appointment.performAt),
      dataReceivedAt: toDateInput(appointment.dataReceivedAt),
    })
    setError('')
  }

  function set<K extends string>(key: K, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function save() {
    if (!appointment) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/appointments/${appointment._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error ?? 'Cập nhật thất bại')
        return
      }
      onSaved()
      onClose()
    } catch {
      setError('Không thể kết nối máy chủ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={!!appointment}
      title="Sửa lịch hẹn"
      onClose={onClose}
      size="lg"
      footer={
        <>
          {error && <span className="mr-auto self-center text-sm text-red-600">{error}</span>}
          <button onClick={onClose} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Huỷ
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Lưu
          </button>
        </>
      }
    >
      <AppointmentFields form={form} set={set} cats={cats} />
    </Modal>
  )
}

/* ---------------- Create ---------------- */
function CreateModal({
  open,
  cats,
  onClose,
  onCreated,
}: {
  open: boolean
  cats: CategoryMap
  onClose: () => void
  onCreated: () => void
}) {
  const [form, setForm] = useState<Record<string, unknown>>({})
  const [wasOpen, setWasOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Reset form mỗi khi mở
  if (open && !wasOpen) {
    setWasOpen(true)
    setForm({ surgery: false, test: false, revenue: 0, doctor: DEFAULT_DOCTOR })
    setError('')
  }
  if (!open && wasOpen) setWasOpen(false)

  function set(key: string, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function save() {
    if (!form.customerName || !form.performAt) {
      setError('Vui lòng nhập Tên KH và Ngày giờ thực hiện')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error ?? 'Tạo thất bại')
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

  return (
    <Modal
      open={open}
      title="Tạo mới lịch hẹn"
      onClose={onClose}
      size="lg"
      footer={
        <>
          {error && <span className="mr-auto self-center text-sm text-red-600">{error}</span>}
          <button onClick={onClose} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Huỷ
          </button>
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Tạo lịch hẹn
          </button>
        </>
      }
    >
      <AppointmentFields form={form} set={set} cats={cats} lockDoctor />
    </Modal>
  )
}

export const DEFAULT_DOCTOR = 'Bs. Đình Khanh'

function Section({ title }: { title: string }) {
  return (
    <div className="-mx-5 mb-4 mt-6 bg-gray-100 px-5 py-2.5 first:mt-0">
      <h3 className="text-sm font-bold text-gray-700">{title}</h3>
    </div>
  )
}

/* ---------------- Shared form fields (chia section) ---------------- */
function AppointmentFields({
  form,
  set,
  cats,
  lockDoctor = false,
}: {
  form: Record<string, unknown>
  set: (key: string, value: unknown) => void
  cats: CategoryMap
  lockDoctor?: boolean
}) {
  const v = (k: string) => (form[k] as string) ?? ''
  return (
    <div>
      {/* Thông tin khách hàng */}
      <Section title="Thông tin khách hàng" />
      <div className="grid gap-4 sm:grid-cols-2">
        <F label="Tên KH"><input className="input" value={v('customerName')} onChange={(e) => set('customerName', e.target.value)} /></F>
        <F label="Tuổi"><input type="number" className="input" value={v('age')} onChange={(e) => set('age', e.target.value ? Number(e.target.value) : undefined)} /></F>
        <F label="Số ĐT/Hộ chiếu"><input className="input" value={v('phone')} onChange={(e) => set('phone', e.target.value)} /></F>
        <F label="Ngày giờ thực hiện"><input type="datetime-local" className="input" value={v('performAt')} onChange={(e) => set('performAt', e.target.value)} /></F>
        <F label="Bác sĩ">
          <input
            className="input disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
            value={lockDoctor ? DEFAULT_DOCTOR : v('doctor')}
            disabled={lockDoctor}
            onChange={(e) => set('doctor', e.target.value)}
          />
        </F>
        <Sel label="Tỉnh" options={cats.province?.options} value={v('province')} onChange={(x) => set('province', x)} />
        <F label="Địa chỉ" full><input className="input" value={v('address')} onChange={(e) => set('address', e.target.value)} placeholder="VD: Số 64, Nguyễn Huy Tưởng" /></F>
      </div>

      {/* Thông tin nguồn */}
      <Section title="Thông tin nguồn" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Sel label="Nguồn" options={cats.source?.options} value={v('source')} onChange={(x) => set('source', x)} />
        <F label="Nguồn phụ"><input className="input" value={v('subSource')} onChange={(e) => set('subSource', e.target.value)} /></F>
        <F label="Telesale"><input className="input" value={v('telesale')} onChange={(e) => set('telesale', e.target.value)} /></F>
        <F label="Telesale CTV"><input className="input" value={v('telesaleCtv')} onChange={(e) => set('telesaleCtv', e.target.value)} /></F>
        <Sel label="Kết quả" options={cats.result?.options} value={v('result')} onChange={(x) => set('result', x)} />
        <Sel label="Báo giá" options={cats.quote?.options} value={v('quote')} onChange={(x) => set('quote', x)} />
        <F label="Nguồn gr tiếp cận sau" full><input className="input" value={v('groupSource')} onChange={(e) => set('groupSource', e.target.value)} /></F>
      </div>

      {/* Chọn dịch vụ */}
      <Section title="Chọn dịch vụ" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Sel label="Dịch vụ chính" options={cats.service?.options} value={v('service1')} onChange={(x) => set('service1', x)} />
        <Sel label="Dịch vụ phát sinh" options={cats.service?.options} value={v('service2')} onChange={(x) => set('service2', x)} />
        <div className="flex items-center gap-6 sm:col-span-2">
          <span className="text-sm font-medium text-gray-700">Loại dịch vụ:</span>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={!!form.surgery} onChange={(e) => set('surgery', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand" /> Ca phẫu thuật
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={!!form.test} onChange={(e) => set('test', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand" /> Xét nghiệm
          </label>
        </div>
      </div>

      {/* Sale & Ghi chú */}
      <Section title="Sale & Ghi chú" />
      <div className="grid gap-4 sm:grid-cols-2">
        <F label="Sale 1"><input className="input" value={v('sale1')} onChange={(e) => set('sale1', e.target.value)} /></F>
        <F label="Sale 2"><input className="input" value={v('sale2')} onChange={(e) => set('sale2', e.target.value)} /></F>
        <F label="Doanh thu (đ)"><input type="number" className="input" value={v('revenue')} onChange={(e) => set('revenue', e.target.value ? Number(e.target.value) : 0)} /></F>
        <F label="Media"><input className="input" value={v('media')} onChange={(e) => set('media', e.target.value)} /></F>
        <F label="Ngày nhận data"><input type="date" className="input" value={v('dataReceivedAt')} onChange={(e) => set('dataReceivedAt', e.target.value)} /></F>
        <F label="Ghi âm (đường dẫn)"><input className="input" value={v('recording')} onChange={(e) => set('recording', e.target.value)} placeholder="Link file ghi âm (MP3, WAV, M4A)" /></F>
        <F label="Ghi chú Telesale" full><textarea className="input min-h-16" value={v('telesaleNote')} onChange={(e) => set('telesaleNote', e.target.value)} /></F>
        <F label="Ghi chú của sale" full><textarea className="input min-h-16" value={v('saleNote')} onChange={(e) => set('saleNote', e.target.value)} /></F>
        <F label="Ghi chú của MKT" full><textarea className="input min-h-16" value={v('mktNote')} onChange={(e) => set('mktNote', e.target.value)} placeholder="Nhập ghi chú của MKT..." /></F>
      </div>
    </div>
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
function Sel({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options?: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <F label={label}>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">-- Chọn --</option>
        {(options ?? []).map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
        {value && !(options ?? []).includes(value) && <option value={value}>{value}</option>}
      </select>
    </F>
  )
}

/* ---------------- Delete ---------------- */
function DeleteModal({
  appointment,
  onClose,
  onDeleted,
}: {
  appointment: Appointment | null
  onClose: () => void
  onDeleted: () => void
}) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function confirm() {
    if (!appointment) return
    setDeleting(true)
    setError('')
    try {
      const res = await fetch(`/api/appointments/${appointment._id}`, { method: 'DELETE' })
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
      open={!!appointment}
      title="Xác nhận xoá"
      onClose={onClose}
      size="sm"
      footer={
        <>
          {error && <span className="mr-auto self-center text-sm text-red-600">{error}</span>}
          <button onClick={onClose} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Huỷ
          </button>
          <button
            onClick={confirm}
            disabled={deleting}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />} Xoá
          </button>
        </>
      }
    >
      <p className="text-sm text-gray-600">
        Bạn có chắc chắn muốn xoá lịch hẹn của{' '}
        <span className="font-semibold text-gray-900">{appointment?.customerName}</span>? Hành động này không thể hoàn tác.
      </p>
    </Modal>
  )
}
