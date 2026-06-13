'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Check, Loader2, GripVertical } from 'lucide-react'
import { CATEGORY_TYPES, CATEGORY_LABELS, type CategoryType } from '@/lib/categories'

export default function CategoryEditor() {
  const [active, setActive] = useState<CategoryType>(CATEGORY_TYPES[0])
  // Cache options theo từng tab; undefined = chưa tải.
  const [cache, setCache] = useState<Record<string, string[]>>({})
  const [loadingTab, setLoadingTab] = useState(false)

  // Trạng thái cho thao tác trên tab đang mở
  const [newValue, setNewValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Lazy-load: chỉ gọi API khi mở tab chưa tải
  useEffect(() => {
    if (cache[active] !== undefined) return
    let cancelled = false
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setLoadingTab(true)
    fetch(`/api/categories/${active}`)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setCache((prev) => ({ ...prev, [active]: j.data?.options ?? [] }))
      })
      .catch(() => {
        if (!cancelled) setCache((prev) => ({ ...prev, [active]: [] }))
      })
      .finally(() => {
        if (!cancelled) setLoadingTab(false)
      })
    return () => {
      cancelled = true
    }
  }, [active, cache])

  function switchTab(type: CategoryType) {
    setActive(type)
    setNewValue('')
    setSaved(false)
    setError('')
  }

  const options = cache[active]
  function setOptions(opts: string[]) {
    setCache((prev) => ({ ...prev, [active]: opts }))
  }

  function addOption() {
    const v = newValue.trim()
    if (!v || (options ?? []).includes(v)) {
      setNewValue('')
      return
    }
    setOptions([...(options ?? []), v])
    setNewValue('')
  }
  function updateOption(idx: number, value: string) {
    const next = [...(options ?? [])]
    next[idx] = value
    setOptions(next)
  }
  function removeOption(idx: number) {
    setOptions((options ?? []).filter((_, i) => i !== idx))
  }

  async function save() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const cleaned = (options ?? []).map((o) => o.trim()).filter(Boolean)
      const res = await fetch(`/api/categories/${active}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options: cleaned }),
      })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error ?? 'Lưu thất bại')
        return
      }
      setOptions(cleaned)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Không thể kết nối máy chủ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-gray-100 p-2">
        {CATEGORY_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => switchTab(type)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              active === type
                ? 'bg-brand text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {CATEGORY_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Nội dung tab đang mở */}
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">{CATEGORY_LABELS[active]}</h2>
          {options !== undefined && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              {options.length} tuỳ chọn
            </span>
          )}
        </div>

        {loadingTab || options === undefined ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
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

            <div className="mb-4 flex gap-2">
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

            <div className="flex items-center gap-3">
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
          </>
        )}
      </div>
    </div>
  )
}
