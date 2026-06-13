'use client'

import { useState } from 'react'
import { Plus, Trash2, Check, Loader2, GripVertical } from 'lucide-react'
import { CATEGORY_TYPES, CATEGORY_LABELS, type CategoryType } from '@/lib/categories'

type CategoryMap = Record<string, { label: string; options: string[] }>

export default function CategoryEditor({ initial }: { initial: CategoryMap }) {
  const [data, setData] = useState<Record<string, string[]>>(() => {
    const d: Record<string, string[]> = {}
    for (const t of CATEGORY_TYPES) d[t] = initial[t]?.options ?? []
    return d
  })

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {CATEGORY_TYPES.map((type) => (
        <CategoryCard
          key={type}
          type={type}
          options={data[type]}
          onChange={(opts) => setData((prev) => ({ ...prev, [type]: opts }))}
        />
      ))}
    </div>
  )
}

function CategoryCard({
  type,
  options,
  onChange,
}: {
  type: CategoryType
  options: string[]
  onChange: (opts: string[]) => void
}) {
  const [newValue, setNewValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function addOption() {
    const v = newValue.trim()
    if (!v || options.includes(v)) {
      setNewValue('')
      return
    }
    onChange([...options, v])
    setNewValue('')
  }
  function updateOption(idx: number, value: string) {
    const next = [...options]
    next[idx] = value
    onChange(next)
  }
  function removeOption(idx: number) {
    onChange(options.filter((_, i) => i !== idx))
  }

  async function save() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const cleaned = options.map((o) => o.trim()).filter(Boolean)
      const res = await fetch(`/api/categories/${type}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options: cleaned }),
      })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error ?? 'Lưu thất bại')
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Không thể kết nối máy chủ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">{CATEGORY_LABELS[type]}</h2>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
          {options.length} tuỳ chọn
        </span>
      </div>

      <div className="mb-3 space-y-2">
        {options.length === 0 && (
          <p className="text-sm text-gray-400">Chưa có tuỳ chọn nào.</p>
        )}
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 shrink-0 text-gray-300" />
            <input
              value={opt}
              onChange={(e) => updateOption(idx, e.target.value)}
              className="input flex-1"
            />
            <button
              onClick={() => removeOption(idx)}
              className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
              aria-label="Xoá"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mb-3 flex gap-2">
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addOption()
            }
          }}
          placeholder="Thêm tuỳ chọn mới..."
          className="input flex-1"
        />
        <button
          onClick={addOption}
          className="flex items-center gap-1 rounded-lg border border-brand/30 bg-brand/5 px-3 text-sm font-medium text-brand hover:bg-brand/10"
        >
          <Plus className="h-4 w-4" /> Thêm
        </button>
      </div>

      <div className="mt-auto flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Lưu
        </button>
        {saved && <span className="text-sm text-green-600">Đã lưu ✓</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  )
}
