import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import UserManager from '@/components/UserManager'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')

  return <UserManager />
}
