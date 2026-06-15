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

/** Các ô TIỀN kế toán nhập tay (theo nhóm/ngày). Tổng chi phí (7) là tự tính. */
export const COST_MONEY_FIELDS = ['revenue', 'groupCost', 'budget', 'roomCostND'] as const

/** Các ô SỐ ĐẾM kế toán nhập tay (theo nhóm/ngày). */
export const COST_COUNT_FIELDS = [
  'messData',
  'messSpam',
  'totalPhone',
  'phoneReached',
  'bookTN',
  'bookOldData',
  'bookRedirect',
  'newCustomerAtSite',
  'surgeryCount',
  'surgeryDepositThisMonth',
  'failAtSite',
  'failReclose',
  'failDoctorReject',
  'hardReachData1',
] as const

/** Toàn bộ ô kế toán nhập (18 ô). */
export const COST_INPUT_FIELDS = [...COST_MONEY_FIELDS, ...COST_COUNT_FIELDS] as const

export type CostField = (typeof COST_INPUT_FIELDS)[number]

export const COST_FIELD_LABELS: Record<CostField, string> = {
  revenue: 'Doanh thu',
  groupCost: 'Chi phí thuê group',
  budget: 'Ngân sách',
  roomCostND: 'Chi phí phòng ND',
  messData: 'Mess data',
  messSpam: 'Mess rác',
  totalPhone: 'Tổng SĐT',
  phoneReached: 'Tổng SĐT tiếp cận',
  bookTN: 'Lịch đặt TN',
  bookOldData: 'Lịch đặt từ data cũ',
  bookRedirect: 'Lịch đặt điều hướng',
  newCustomerAtSite: 'Khách mới qua cơ sở',
  surgeryCount: 'Số ca mổ',
  surgeryDepositThisMonth: 'Số ca mổ cọc trong tháng',
  failAtSite: 'Khách fail tại cơ sở',
  failReclose: 'Khách fail chốt lại',
  failDoctorReject: 'Ca fail bác sĩ từ chối',
  hardReachData1: 'Số data lần 1 khó tiếp cận',
}

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
