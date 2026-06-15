'use client'

import { useCallback, useEffect, useState } from 'react'
import { Wallet, Plus, Save, Loader2, Check, Trash2, Pencil } from 'lucide-react'
import Modal from '@/components/Modal'
import {
  LEAD_ROLES,
  LEAD_ROLE_LABELS,
  COST_MONEY_FIELDS,
  COST_COUNT_FIELDS,
  COST_INPUT_FIELDS,
  COST_FIELD_LABELS,
  dateKeyToYmd,
} from '@/lib/leadReport'
import { formatDateVN } from '@/lib/format'

interface CostItem {
  _id: string
  leadRole: string
  date: string
  dateKey: string
  [key: string]: number | string
}

type Values = Record<string, string>

const emptyValues = (): Values => {
  const o: Values = {}
  for (const k of COST_INPUT_FIELDS) o[k] = ''
  return o
}

/** Hiển thị số thô '32000' -> '32.000' (dấu chấm phân cách nghìn). */
const formatThousand = (raw: string) => {
  const digits = raw.replace(/\D/g, '')
  return digits ? Number(digits).toLocaleString('vi-VN') : ''
}

/** Tiền: 0 -> '0 ₫' (không hiện '-'). */
const money = (n: number) => `${Math.round(n).toLocaleString('vi-VN')} ₫`

const roleLabel = (r: string) => LEAD_ROLE_LABELS[r as keyof typeof LEAD_ROLE_LABELS] ?? r

export default function CostManager() {
  const [items, setItems] = useState<CostItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterRole, setFilterRole] = useState<string>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [formItem, setFormItem] = useState<CostItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<CostItem | null>(null)

  const load = useCallback(async (role: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/daily-costs?role=${role}`)
      const json = await res.json()
      setItems(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(filterRole)
  }, [load, filterRole])

  function openCreate() {
    setFormItem(null)
    setFormOpen(true)
  }
  function openEdit(item: CostItem) {
    setFormItem(item)
    setFormOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-800">
          <Wallet className="h-6 w-6 text-brand" /> Nhập số liệu theo ngày
        </h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          <Plus className="h-4 w-4" /> Nhập liệu
        </button>
      </div>

      {/* Bộ lọc nhóm */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600">Lọc nhóm:</span>
        <select className="input max-w-xs" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="all">Tất cả nhóm</option>
          {LEAD_ROLES.map((r) => (
            <option key={r} value={r}>
              {LEAD_ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </div>

      {/* Bảng dữ liệu (tóm tắt) */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brand-navy text-left text-xs font-semibold uppercase text-white">
              <th className="px-4 py-3">STT</th>
              <th className="px-4 py-3">Ngày nhập</th>
              <th className="px-4 py-3">Nhóm</th>
              <th className="px-4 py-3 text-right">Doanh thu</th>
              <th className="px-4 py-3 text-right">Tổng chi phí</th>
              <th className="px-4 py-3 text-right">Ngân sách</th>
              <th className="px-4 py-3 text-right">Tổng SĐT</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-gray-400">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-gray-400">
                  Chưa có dữ liệu.
                </td>
              </tr>
            ) : (
              items.map((c, i) => (
                <tr key={c._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{formatDateVN(c.date)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
                      {roleLabel(c.leadRole)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{money(Number(c.revenue) || 0)}</td>
                  <td className="px-4 py-3 text-right">{money(Number(c.totalCost) || 0)}</td>
                  <td className="px-4 py-3 text-right">{money(Number(c.budget) || 0)}</td>
                  <td className="px-4 py-3 text-right">{Number(c.totalPhone) || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEdit(c)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Sửa
                      </button>
                      <button
                        onClick={() => setDeleteItem(c)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CostFormModal
        open={formOpen}
        item={formItem}
        onClose={() => setFormOpen(false)}
        onSaved={() => load(filterRole)}
      />
      <DeleteCostModal item={deleteItem} onClose={() => setDeleteItem(null)} onDeleted={() => load(filterRole)} />
    </div>
  )
}

function CostFormModal({
  open,
  item,
  onClose,
  onSaved,
}: {
  open: boolean
  item: CostItem | null
  onClose: () => void
  onSaved: () => void
}) {
  const [leadRole, setLeadRole] = useState<string>(LEAD_ROLES[0])
  const [date, setDate] = useState('')
  const [values, setValues] = useState<Values>(emptyValues)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [initKey, setInitKey] = useState<string | null>(null)

  // Khởi tạo form khi mở (thêm mới hoặc sửa) — theo pattern set-state-in-render.
  const key = open ? item?._id ?? 'new' : null
  if (key !== null && key !== initKey) {
    setInitKey(key)
    setError('')
    if (item) {
      setLeadRole(item.leadRole)
      setDate(dateKeyToYmd(item.dateKey))
      const v: Values = {}
      for (const k of COST_INPUT_FIELDS) v[k] = String(item[k] ?? 0)
      setValues(v)
    } else {
      setLeadRole(LEAD_ROLES[0])
      setDate('')
      setValues(emptyValues())
    }
  }
  if (key === null && initKey !== null) setInitKey(null)

  const setVal = (k: string, v: string) => setValues((prev) => ({ ...prev, [k]: v }))

  async function save() {
    if (!date) {
      setError('Vui lòng chọn ngày nhập')
      return
    }
    setSaving(true)
    setError('')
    try {
      const body: Record<string, unknown> = { leadRole, date }
      for (const k of COST_INPUT_FIELDS) body[k] = Number(values[k]) || 0
      const res = await fetch('/api/daily-costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error ?? 'Lưu thất bại')
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
      open={open}
      title={item ? 'Cập nhật số liệu' : 'Nhập số liệu'}
      onClose={onClose}
      size="lg"
      footer={
        <>
          {error && <span className="mr-auto self-center text-sm text-red-600">{error}</span>}
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Huỷ
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {item ? 'Cập nhật' : 'Lưu'}
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nhóm">
          <select className="input" value={leadRole} onChange={(e) => setLeadRole(e.target.value)}>
            {LEAD_ROLES.map((r) => (
              <option key={r} value={r}>
                {LEAD_ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ngày nhập">
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>

      <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-gray-500">
        Doanh thu &amp; chi phí (₫)
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COST_MONEY_FIELDS.map((k) => (
          <Field key={k} label={COST_FIELD_LABELS[k]}>
            <input
              type="text"
              inputMode="numeric"
              className="input"
              value={formatThousand(values[k])}
              onChange={(e) => setVal(k, e.target.value.replace(/\D/g, ''))}
            />
          </Field>
        ))}
      </div>

      <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-gray-500">Số đếm vận hành</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COST_COUNT_FIELDS.map((k) => (
          <Field key={k} label={COST_FIELD_LABELS[k]}>
            <input
              type="number"
              min={0}
              className="input"
              value={values[k]}
              onChange={(e) => setVal(k, e.target.value)}
            />
          </Field>
        ))}
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Mỗi nhóm chỉ có 1 bản ghi cho mỗi ngày — nhập lại cùng nhóm &amp; ngày sẽ ghi đè. &quot;Khách fail
        tại cơ sở&quot; và &quot;Ca fail bác sĩ từ chối&quot; tự suy từ Lịch hẹn, không nhập ở đây.
      </p>
    </Modal>
  )
}

function DeleteCostModal({
  item,
  onClose,
  onDeleted,
}: {
  item: CostItem | null
  onClose: () => void
  onDeleted: () => void
}) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function confirm() {
    if (!item) return
    setDeleting(true)
    setError('')
    try {
      const res = await fetch(`/api/daily-costs/${item._id}`, { method: 'DELETE' })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error ?? 'Xóa thất bại')
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
      open={!!item}
      title="Xóa số liệu"
      onClose={onClose}
      size="sm"
      footer={
        <>
          {error && <span className="mr-auto self-center text-sm text-red-600">{error}</span>}
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Huỷ
          </button>
          <button
            onClick={confirm}
            disabled={deleting}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Xóa
          </button>
        </>
      }
    >
      <p className="text-sm text-gray-600">
        Xóa số liệu ngày{' '}
        <span className="font-semibold text-gray-900">{item ? formatDateVN(item.date) : ''}</span> (nhóm{' '}
        <span className="font-semibold text-gray-900">{item ? roleLabel(item.leadRole) : ''}</span>)? Hành
        động này không thể hoàn tác.
      </p>
    </Modal>
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
