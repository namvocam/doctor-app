import Link from 'next/link'
import { Clock, CalendarDays, LayoutGrid, ChevronRight, UserRound } from 'lucide-react'
import { connectToDatabase } from '@/lib/mongodb'
import AppointmentModel from '@/models/Appointment'
import { getCurrentUser } from '@/lib/session'
import { formatFullDateVN, formatNumber } from '@/lib/format'

export const dynamic = 'force-dynamic'

async function getStats() {
  await connectToDatabase()
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)

  const [todayCount, totalCount] = await Promise.all([
    AppointmentModel.countDocuments({ performAt: { $gte: start, $lte: end } }),
    AppointmentModel.countDocuments({}),
  ])
  return { todayCount, totalCount }
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const { todayCount, totalCount } = await getStats()

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Greeting */}
      <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand">
          <UserRound className="h-7 w-7" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Xin chào, <span className="text-brand">{user?.name ?? 'bạn'}</span>
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
            <CalendarDays className="h-4 w-4" />
            {formatFullDateVN(new Date())}
          </p>
        </div>
      </div>

      {/* Overview */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand">
          <LayoutGrid className="h-4 w-4" /> Tổng quan
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:max-w-3xl">
          <StatCard
            label="Lịch hẹn hôm nay"
            value={formatNumber(todayCount)}
            href="/appointments?view=today"
            icon={<Clock className="h-6 w-6" />}
            color="brand"
          />
          <StatCard
            label="Tổng lịch hẹn"
            value={formatNumber(totalCount)}
            href="/appointments"
            icon={<CalendarDays className="h-6 w-6" />}
            color="accent"
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  href,
  icon,
  color,
}: {
  label: string
  value: string
  href: string
  icon: React.ReactNode
  color: 'brand' | 'accent'
}) {
  const valueColor = color === 'brand' ? 'text-brand' : 'text-accent'
  const iconBg = color === 'brand' ? 'bg-brand/10 text-brand' : 'bg-accent/10 text-accent'
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`mt-1 text-3xl font-bold ${valueColor}`}>{value}</p>
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
          {icon}
        </span>
      </div>
      <Link
        href={href}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
      >
        Chi tiết <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
