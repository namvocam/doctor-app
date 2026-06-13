'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  CalendarClock,
  ChevronRight,
  ChevronDown,
  Clock,
  CalendarCheck2,
  Stethoscope,
  Settings2,
} from 'lucide-react'
import Logo from '@/components/Logo'

interface NavChild {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
}

function NavLink({ href, label, exact = false }: { href: string; label: string; exact?: boolean }) {
  const pathname = usePathname()
  const active = exact ? pathname === href.split('?')[0] : pathname.startsWith(href.split('?')[0])
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
        active
          ? 'bg-brand text-white font-semibold shadow-sm'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <span>{label}</span>
      <ChevronRight className="h-4 w-4 opacity-60" />
    </Link>
  )
}

function CollapsibleGroup({
  label,
  icon: Icon,
  items,
  defaultOpen = false,
  baseHref,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  items: NavChild[]
  defaultOpen?: boolean
  baseHref: string
}) {
  const pathname = usePathname()
  const groupActive = pathname.startsWith(baseHref)
  const [open, setOpen] = useState(defaultOpen || groupActive)

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
          groupActive ? 'bg-brand text-white font-semibold shadow-sm' : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <span className="flex items-center gap-2.5">
          <Icon className="h-4.5 w-4.5" />
          {label}
        </span>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open && (
        <div className="mt-1 space-y-1 pl-4">
          {items.map((c) => {
            const active = pathname + '' === c.href || pathname.startsWith(c.href.split('?')[0]) && c.href !== baseHref
            const ChildIcon = c.icon
            return (
              <Link
                key={c.href}
                href={c.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                  active ? 'bg-brand/10 text-brand font-medium' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {ChildIcon && <ChildIcon className="h-4 w-4" />}
                {c.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({
  role,
  onNavigate,
}: {
  role?: string
  onNavigate?: () => void
}) {
  return (
    <aside
      className="flex h-full w-64 flex-col border-r border-gray-200 bg-white"
      onClick={onNavigate}
    >
      <div className="flex h-16 items-center justify-center border-b border-gray-100 px-4">
        <Logo size="md" />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        <NavLink href="/dashboard" label="Dashboard" exact />

        <p className="px-3 pb-1 pt-4 text-xs font-bold uppercase tracking-wide text-accent">
          Báo cáo
        </p>
        <Link
          href="/reports/lead-phau"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-100"
        >
          <BarChart3 className="h-4 w-4" />
          Xem báo cáo LEAD phẫu
          <ChevronRight className="ml-auto h-4 w-4 opacity-60" />
        </Link>
        <Link
          href="/reports/lead-yhct"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-100"
        >
          <BarChart3 className="h-4 w-4" />
          Xem báo cáo LEAD YHCT
          <ChevronRight className="ml-auto h-4 w-4 opacity-60" />
        </Link>

        <p className="px-3 pb-1 pt-4 text-xs font-bold uppercase tracking-wide text-accent">
          Quản lý
        </p>
        <CollapsibleGroup
          label="Lịch hẹn"
          icon={CalendarClock}
          baseHref="/appointments"
          defaultOpen
          items={[
            { label: 'Hôm nay (theo tháng)', href: '/appointments?view=today', icon: Clock },
            { label: 'Tất cả', href: '/appointments', icon: CalendarClock },
          ]}
        />
        <CollapsibleGroup
          label="Tái khám"
          icon={Stethoscope}
          baseHref="/reexam"
          items={[
            { label: 'Tái khám hôm nay', href: '/reexam?view=today', icon: CalendarCheck2 },
            { label: 'Tất cả tái khám', href: '/reexam', icon: CalendarClock },
          ]}
        />

        {role === 'admin' && (
          <>
            <p className="px-3 pb-1 pt-4 text-xs font-bold uppercase tracking-wide text-accent">
              Quản trị
            </p>
            <Link
              href="/admin/categories"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-100"
            >
              <Settings2 className="h-4 w-4" />
              Cấu hình danh mục
              <ChevronRight className="ml-auto h-4 w-4 opacity-60" />
            </Link>
          </>
        )}
      </nav>
    </aside>
  )
}
