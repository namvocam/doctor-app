'use client'

import { useEffect, useState, useCallback } from 'react'
import { UserPlus, KeyRound, Loader2, Check, Users } from 'lucide-react'
import Modal from '@/components/Modal'
import { ASSIGNABLE_ROLES, ROLE_LABELS } from '@/lib/permissions'

interface UserItem {
  _id: string
  username: string
  name: string
  role: string
}

export default function UserManager() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [resetUser, setResetUser] = useState<UserItem | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      const json = await res.json()
      setUsers(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-800">
          <Users className="h-6 w-6 text-brand" /> Quản lý tài khoản
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          <UserPlus className="h-4 w-4" /> Tạo tài khoản
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brand-navy text-left text-xs font-semibold uppercase text-white">
              <th className="px-4 py-3">STT</th>
              <th className="px-4 py-3">Tên</th>
              <th className="px-4 py-3">Tên đăng nhập</th>
              <th className="px-4 py-3">Vai trò</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-10 text-center text-gray-400"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="py-10 text-center text-gray-400">Chưa có tài khoản.</td></tr>
            ) : (
              users.map((u, i) => (
                <tr key={u._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                  <td className="px-4 py-3">{u.username}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setResetUser(u)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <KeyRound className="h-3.5 w-3.5" /> Đặt lại mật khẩu
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CreateUserModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={load} />
      <ResetPasswordModal user={resetUser} onClose={() => setResetUser(null)} />
    </div>
  )
}

function CreateUserModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', username: '', role: 'sale', password: '' })
  const [wasOpen, setWasOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (open && !wasOpen) {
    setWasOpen(true)
    setForm({ name: '', username: '', role: 'sale', password: '' })
    setError('')
  }
  if (!open && wasOpen) setWasOpen(false)

  async function save() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/users', {
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
      title="Tạo tài khoản mới"
      onClose={onClose}
      size="sm"
      footer={
        <>
          {error && <span className="mr-auto self-center text-sm text-red-600">{error}</span>}
          <button onClick={onClose} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Huỷ</button>
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Tạo
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Họ tên"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Tên đăng nhập"><input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
        <Field label="Vai trò">
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </Field>
        <Field label="Mật khẩu"><input type="text" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Tối thiểu 4 ký tự" /></Field>
      </div>
    </Modal>
  )
}

function ResetPasswordModal({ user, onClose }: { user: UserItem | null; onClose: () => void }) {
  const [password, setPassword] = useState('')
  const [initId, setInitId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  if (user && user._id !== initId) {
    setInitId(user._id)
    setPassword('')
    setError('')
    setDone(false)
  }

  async function save() {
    if (!user) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/users/${user._id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error ?? 'Thất bại')
        return
      }
      setDone(true)
      setTimeout(onClose, 1200)
    } catch {
      setError('Không thể kết nối máy chủ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={!!user}
      title="Đặt lại mật khẩu"
      onClose={onClose}
      size="sm"
      footer={
        <>
          {error && <span className="mr-auto self-center text-sm text-red-600">{error}</span>}
          <button onClick={onClose} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Đóng</button>
          <button onClick={save} disabled={saving || done} className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Đặt lại
          </button>
        </>
      }
    >
      {done ? (
        <p className="text-sm text-green-600">Đã đặt lại mật khẩu cho {user?.name} ✓</p>
      ) : (
        <Field label={`Mật khẩu mới cho "${user?.name}"`}>
          <input type="text" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tối thiểu 4 ký tự" />
        </Field>
      )}
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
