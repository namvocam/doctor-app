/** Hằng số cho báo cáo LEAD phẫu (dùng chung client/server, không phụ thuộc mongoose). */

export const LEAD_ROLES = ['manager-collaborator', 'tiktok', 'ads'] as const

export type LeadRole = (typeof LEAD_ROLES)[number]

export const LEAD_ROLE_LABELS: Record<LeadRole, string> = {
  'manager-collaborator': 'Lead quản lý CTV',
  tiktok: 'Lead Tiktok',
  ads: 'Lead ADS',
}

/** Kết quả lịch hẹn được tính là có doanh thu (đã phẫu thuật). */
export const REVENUE_RESULT = 'Phẫu thuật'

/** 'yyyy-mm-dd' (input date) -> 'dd/mm/yyyy' (khớp dateKey của báo cáo). */
export function ymdToDateKey(ymd: string): string {
  const [y, m, d] = ymd.split('-')
  if (!y || !m || !d) return ''
  return `${d}/${m}/${y}`
}

/** 'dd/mm/yyyy' -> 'yyyy-mm-dd' (đổ ngược vào input date). */
export function dateKeyToYmd(key: string): string {
  const [d, m, y] = key.split('/')
  if (!y || !m || !d) return ''
  return `${y}-${m}-${d}`
}
