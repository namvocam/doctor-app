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

/** Kết quả lịch hẹn cho 2 cột suy ra tự động trong báo cáo. */
export const RESULT_FAIL_AT_SITE = 'Failed' // Khách fail tại cơ sở
export const RESULT_DOCTOR_REJECT = 'Bác sĩ từ chối' // Ca fail bác sĩ từ chối

/** Các ô TIỀN kế toán nhập tay (theo nhóm/ngày). */
export const COST_MONEY_FIELDS = ['revenue', 'totalCost', 'groupCost', 'budget'] as const

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
  'depositAndService',
  'surgeryDepositThisMonth',
  'surgeryDepositOldMonth',
  'failReclose',
  'hardReachData1',
] as const

/** Toàn bộ ô kế toán nhập (17 ô). */
export const COST_INPUT_FIELDS = [...COST_MONEY_FIELDS, ...COST_COUNT_FIELDS] as const

export type CostField = (typeof COST_INPUT_FIELDS)[number]

export const COST_FIELD_LABELS: Record<CostField, string> = {
  revenue: 'Doanh thu',
  totalCost: 'Tổng chi phí',
  groupCost: 'Chi phí thuê group',
  budget: 'Ngân sách',
  messData: 'Mess data',
  messSpam: 'Mess rác',
  totalPhone: 'Tổng SĐT',
  phoneReached: 'Tổng SĐT tiếp cận',
  bookTN: 'Lịch đặt TN',
  bookOldData: 'Lịch đặt từ data cũ',
  bookRedirect: 'Lịch đặt điều hướng',
  newCustomerAtSite: 'Khách mới qua cơ sở',
  depositAndService: 'Khách cọc và SDDV',
  surgeryDepositThisMonth: 'Số ca mổ cọc trong tháng',
  surgeryDepositOldMonth: 'Số ca mổ cọc tháng cũ',
  failReclose: 'Khách fail chốt lại',
  hardReachData1: 'Số data lần 1 khó tiếp cận',
}

/** Ô là loại tiền (để format ₫). */
export const COST_MONEY_SET: ReadonlySet<string> = new Set(COST_MONEY_FIELDS)

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
