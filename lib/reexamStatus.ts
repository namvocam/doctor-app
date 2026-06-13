/** Trạng thái lịch tái khám + màu sắc (dùng chung client/server, không phụ thuộc mongoose). */

export const REEXAM_STATUSES = [
  'Sắp tới',
  'Quá hạn',
  'Online',
  'Phàn nàn',
  'Xử lý vết thương',
  'Đã huỷ',
] as const

export type ReExamStatus = (typeof REEXAM_STATUSES)[number]

export const DEFAULT_REEXAM_STATUS: ReExamStatus = 'Sắp tới'

/** Màu nền hàng (row) và pill (badge) cho từng trạng thái. */
export const REEXAM_STATUS_STYLE: Record<string, { row: string; pill: string }> = {
  'Sắp tới': { row: 'bg-blue-50', pill: 'bg-blue-100 text-blue-700' },
  'Quá hạn': { row: 'bg-red-100', pill: 'bg-red-100 text-red-700' },
  Online: { row: 'bg-amber-100', pill: 'bg-amber-100 text-amber-700' },
  'Phàn nàn': { row: 'bg-purple-100', pill: 'bg-purple-100 text-purple-700' },
  'Xử lý vết thương': { row: 'bg-orange-100', pill: 'bg-orange-100 text-orange-700' },
  'Đã huỷ': { row: 'bg-gray-200', pill: 'bg-gray-200 text-gray-600' },
}
