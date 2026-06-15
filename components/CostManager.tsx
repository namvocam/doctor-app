'use client'

import { useCallback, useEffect, useState } from 'react'
import { Wallet, Save, Loader2, Check, Trash2, Pencil, RotateCcw } from 'lucide-react'
import Modal from '@/components/Modal'
import { LEAD_ROLES, LEAD_ROLE_LABELS, dateKeyToYmd } from '@/lib/leadReport'
import { formatCurrency, formatDateVN } from '@/lib/format'

interface CostItem {
  _id: string
  leadRole: string
  date: string
  dateKey: string
  totalCost: number
  groupCost: number
  budget: number
}

interface FormState {
  leadRole: string
  date: string
  totalCost: string
  groupCost: string
  budget: string
}

const emptyForm = (): FormState => ({
  leadRole: LEAD_ROLES[0],
  date: '',
  totalCost: '',
  groupCost: '',
  budget: '',
})

export default function CostManager() {
  const [items, setItems] = useState<CostItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterRole, setFilterRole] = useState<string>('all')
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
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

  function resetForm() {
    setForm(emptyForm())
    setEditingId(null)
    setError('')
  }

  function editFrom(item: CostItem) {
    setForm({
      leadRole: item.leadRole,
      date: dateKeyToYmd(item.dateKey),
      totalCost: String(item.totalCost ?? 0),
      groupCost: String(item.groupCost ?? 0),
      budget: String(item.budget ?? 0),
    })
    setEditingId(item._id)
    setError('')
  }

  async function save() {
    if (!form.date) {
      setError('Vui lòng chọn ngày nhập')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/daily-costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadRole: form.leadRole,
          date: form.date,
          totalCost: Number(form.totalCost) || 0,
          groupCost: Number(form.groupCost) || 0,
          budget: Number(form.budget) || 0,
        }),
      })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error ?? 'Lưu thất bại')
        return
      }
      resetForm()
      await load(filterRole)
    } catch {
      setError('Không thể kết nối máy chủ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-xl font-bold text-gray-800">
        <Wallet className="h-6 w-6 text-brand" /> Nhập chi phí theo ngày
      </h1>

      {/* Form nhập */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-brand">
          {editingId ? 'Cập nhật chi phí' : 'Thêm chi phí'}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Nhóm">
            <select
              className="input"
              value={form.leadRole}
              onChange={(e) => setForm({ ...form, leadRole: e.target.value })}
            >
              {LEAD_ROLES.map((r) => (
                <option key={r} value={r}>
                  {LEAD_ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ngày nhập">
            <input
              type="date"
              className="input"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Field>
          <Field label="Tổng chi phí (₫)">
            <input
              type="number"
              min={0}
              className="input"
              value={form.totalCost}
              onChange={(e) => setForm({ ...form, totalCost: e.target.value })}
            />
          </Field>
          <Field label="Chi phí thuê group (₫)">
            <input
              type="number"
              min={0}
              className="input"
              value={form.groupCost}
              onChange={(e) => setForm({ ...form, groupCost: e.target.value })}
            />
          </Field>
          <Field label="Ngân sách (₫)">
            <input
              type="number"
              min={0}
              className="input"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
            />
          </Field>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          {error && <span className="mr-auto text-sm text-red-600">{error}</span>}
          {editingId && (
            <button
              onClick={resetForm}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <RotateCcw className="h-4 w-4" /> Hủy sửa
            </button>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {editingId ? 'Cập nhật' : 'Lưu'}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Mỗi nhóm chỉ có 1 bản ghi cho mỗi ngày — nhập lại cùng nhóm &amp; ngày sẽ ghi đè.
        </p>
      </div>

      {/* Bộ lọc nhóm */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600">Lọc nhóm:</span>
        <select
          className="input max-w-xs"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="all">Tất cả nhóm</option>
          {LEAD_ROLES.map((r) => (
            <option key={r} value={r}>
              {LEAD_ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </div>

      {/* Bảng dữ liệu */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brand-navy text-left text-xs font-semibold uppercase text-white">
              <th className="px-4 py-3">STT</th>
              <th className="px-4 py-3">Ngày nhập</th>
              <th className="px-4 py-3">Nhóm</th>
              <th className="px-4 py-3 text-right">Tổng chi phí</th>
              <th className="px-4 py-3 text-right">Chi phí thuê group</th>
              <th className="px-4 py-3 text-right">Ngân sách</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-gray-400">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-gray-400">
                  Chưa có dữ liệu chi phí.
                </td>
              </tr>
            ) : (
              items.map((c, i) => (
                <tr key={c._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{formatDateVN(c.date)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
                      {LEAD_ROLE_LABELS[c.leadRole as keyof typeof LEAD_ROLE_LABELS] ?? c.leadRole}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{formatCurrency(c.totalCost)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(c.groupCost)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(c.budget)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => editFrom(c)}
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

      <DeleteCostModal
        item={deleteItem}
        onClose={() => setDeleteItem(null)}
        onDeleted={() => load(filterRole)}
      />
    </div>
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
      title="Xóa chi phí"
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
        Xóa chi phí ngày{' '}
        <span className="font-semibold text-gray-900">{item ? formatDateVN(item.date) : ''}</span>{' '}
        (nhóm{' '}
        <span className="font-semibold text-gray-900">
          {item ? LEAD_ROLE_LABELS[item.leadRole as keyof typeof LEAD_ROLE_LABELS] ?? item.leadRole : ''}
        </span>
        )? Hành động này không thể hoàn tác.
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
