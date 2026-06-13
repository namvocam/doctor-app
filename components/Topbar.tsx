'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Menu, User, Settings, LogOut, ChevronDown } from 'lucide-react'

interface TopbarProps {
  user: { name: string; role: string }
  onToggleSidebar: () => void
}

export default function Topbar({ user, onToggleSidebar }: TopbarProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase()

  return (
    <header className="flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4">
      <button
        onClick={onToggleSidebar}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
        aria-label="Mở menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm kiếm khách hàng, SĐT..."
          className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
        />
      </div>

      <div className="ml-auto" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full p-1 pr-2 transition hover:bg-gray-100"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
            {initials || 'U'}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
          </span>
          <ChevronDown className="hidden h-4 w-4 text-gray-400 sm:block" />
        </button>

        {menuOpen && (
          <div className="absolute right-4 top-14 z-50 w-60 rounded-xl border border-gray-100 bg-white py-2 shadow-lg">
            <div className="flex items-center gap-3 border-b border-gray-100 px-4 pb-3 pt-1">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
                {initials || 'U'}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                <p className="text-xs capitalize text-gray-500">{user.role}</p>
              </div>
            </div>
            <button className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
              <User className="h-4 w-4 text-gray-500" /> My Profile
            </button>
            <button className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
              <Settings className="h-4 w-4 text-gray-500" /> Settings
            </button>
            <div className="my-1 border-t border-gray-100" />
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" /> Log Out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
