/** Vai trò + phân quyền (dùng chung client/server, không phụ thuộc mongoose). */

export const ROLES = [
  'admin',
  'ads',
  'tiktok',
  'manager-collaborator',
  'tele-sale',
  'sale',
  'nurse',
] as const

export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  ads: 'ADS',
  tiktok: 'Tiktok',
  'manager-collaborator': 'Quản lý CTV',
  'tele-sale': 'Tele-sale',
  sale: 'Sale',
  nurse: 'Y tá',
}

/** Các role admin được phép tạo (không gồm admin). */
export const ASSIGNABLE_ROLES: Role[] = [
  'ads',
  'tiktok',
  'manager-collaborator',
  'tele-sale',
  'sale',
  'nurse',
]

/* ---------------- Quyền với Lịch hẹn ---------------- */
export function canCreateAppointment(role?: string) {
  return role === 'admin' || role === 'tele-sale'
}
/** Sửa/Xoá đầy đủ lịch hẹn: admin (tất cả), tele-sale (bản ghi của mình). */
export function canEditAppointment(role?: string, isOwner = false) {
  return role === 'admin' || (role === 'tele-sale' && isOwner)
}
/** Đổi trạng thái (kết quả) lịch hẹn: admin, sale, y tá, tele-sale (của mình). */
export function canChangeAppointmentStatus(role?: string, isOwner = false) {
  return (
    role === 'admin' ||
    role === 'sale' ||
    role === 'nurse' ||
    (role === 'tele-sale' && isOwner)
  )
}

/**
 * Các trường lịch hẹn mà role được sửa:
 * - 'all': sửa toàn bộ (admin, tele-sale của mình)
 * - sale: kết quả + ghi chú của sale + doanh thu
 * - y tá: chỉ kết quả (đổi trạng thái)
 * - còn lại: [] (không sửa)
 */
export function editableAppointmentFields(role?: string, isOwner = false): 'all' | string[] {
  if (canEditAppointment(role, isOwner)) return 'all'
  if (role === 'sale') return ['result', 'saleNote', 'revenue']
  if (role === 'nurse') return ['result']
  return []
}

/* ---------------- Quyền với Tái khám ---------------- */
export function canCreateReExam(role?: string) {
  return role === 'admin' || role === 'nurse'
}
/** Sửa/Xoá tái khám: admin (tất cả), y tá (bản ghi của mình). */
export function canEditReExam(role?: string, isOwner = false) {
  return role === 'admin' || (role === 'nurse' && isOwner)
}

/* ---------------- Menu báo cáo ---------------- */
export type LeadReportKey = 'all' | 'ctv' | 'tiktok' | 'ads'

/** Các submenu báo cáo LEAD mà role được xem. */
export function visibleLeadReports(role?: string): LeadReportKey[] {
  switch (role) {
    case 'ads':
      return ['all', 'ads']
    case 'tiktok':
      return ['all', 'tiktok']
    case 'manager-collaborator':
      return ['all', 'ctv']
    default:
      // admin, sale, tele-sale, nurse: xem tất cả
      return ['all', 'ctv', 'tiktok', 'ads']
  }
}
