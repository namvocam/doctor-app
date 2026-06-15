import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { canManageCosts } from '@/lib/permissions'
import CostManager from '@/components/CostManager'

export const dynamic = 'force-dynamic'

export default async function CostsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!canManageCosts(user.role)) redirect('/dashboard')

  return <CostManager />
}
