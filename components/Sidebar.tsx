'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  LayoutDashboard,
  BarChart3,
  CalendarClock,
  ChevronRight,
  ChevronDown,
  Clock,
  CalendarCheck2,
  Stethoscope,
  Settings2,
  Users,
  List,
  Video,
  Megaphone,
} from 'lucide-react'
import Logo from '@/components/Logo'
import { visibleLeadReports } from '@/lib/permissions'

interface NavChild {
  label: string
  href: string
  key?: string
  icon?: React.ComponentType<{ className?: string }>
}

/** So khớp link con với URL hiện tại (so cả pathname lẫn query `view`). */
function useChildActive() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  return (href: string) => {
    const [path, query] = href.split('?')
    if (pathname !== path) return false
    const targetView = new URLSearchParams(query || '').get('view') ?? ''
    const currentView = searchParams.get('view') ?? ''
    return targetView === currentView
  }
}

function NavLink({
  href,
  label,
  icon: Icon,
  exact = false,
  onNavigate,
}: {
  href: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  exact?: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const active = exact ? pathname === href.split('?')[0] : pathname.startsWith(href.split('?')[0])
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
        active
          ? 'bg-brand text-white font-semibold shadow-sm'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {Icon && <Icon className="h-4.5 w-4.5" />}
      <span>{label}</span>
    </Link>
  )
}

function CollapsibleGroup({
  label,
  icon: Icon,
  items,
  defaultOpen = false,
  baseHref,
  onNavigate,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  items: NavChild[]
  defaultOpen?: boolean
  baseHref: string
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const childActive = useChildActive()
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
            const active = childActive(c.href)
            const ChildIcon = c.icon
            return (
              <Link
                key={c.href}
                href={c.href}
                onClick={onNavigate}
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
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-center border-b border-gray-100 px-4">
        <Logo size="md" />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        <NavLink href="/dashboard" label="Dashboard" icon={LayoutDashboard} exact onNavigate={onNavigate} />

        <p className="px-3 pb-1 pt-4 text-xs font-bold uppercase tracking-wide text-accent">
          Báo cáo
        </p>
        <CollapsibleGroup
          label="Xem báo cáo LEAD"
          icon={BarChart3}
          baseHref="/reports/lead-phau"
          onNavigate={onNavigate}
          items={[
            { key: 'all', label: 'Tất cả', href: '/reports/lead-phau', icon: List },
            { key: 'ctv', label: 'Lead quản lý CTV', href: '/reports/lead-phau/ctv', icon: Users },
            { key: 'tiktok', label: 'Lead Tiktok', href: '/reports/lead-phau/tiktok', icon: Video },
            { key: 'ads', label: 'Lead ADS', href: '/reports/lead-phau/ads', icon: Megaphone },
          ].filter((it) => (visibleLeadReports(role) as string[]).includes(it.key))}
        />

        <p className="px-3 pb-1 pt-4 text-xs font-bold uppercase tracking-wide text-accent">
          Quản lý
        </p>
        <CollapsibleGroup
          label="Lịch hẹn"
          icon={CalendarClock}
          baseHref="/appointments"
          defaultOpen
          onNavigate={onNavigate}
          items={[
            { label: 'Hôm nay (theo tháng)', href: '/appointments?view=today', icon: Clock },
            { label: 'Tất cả', href: '/appointments', icon: CalendarClock },
          ]}
        />
        <CollapsibleGroup
          label="Tái khám"
          icon={Stethoscope}
          baseHref="/reexam"
          onNavigate={onNavigate}
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
            <NavLink
              href="/admin/categories"
              label="Cấu hình danh mục"
              icon={Settings2}
              onNavigate={onNavigate}
            />
            <NavLink
              href="/admin/users"
              label="Quản lý tài khoản"
              icon={Users}
              onNavigate={onNavigate}
            />
          </>
        )}
      </nav>
    </aside>
  )
}
