const WEEKDAYS = [
  'Chủ nhật',
  'Thứ hai',
  'Thứ ba',
  'Thứ tư',
  'Thứ năm',
  'Thứ sáu',
  'Thứ bảy',
]

/** "Thứ bảy, 13 tháng 6 2026" */
export function formatFullDateVN(date: Date | string): string {
  const d = new Date(date)
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} tháng ${d.getMonth() + 1} ${d.getFullYear()}`
}

/** "13/06/2026" */
export function formatDateVN(date?: Date | string | null): string {
  if (!date) return '-'
  const d = new Date(date)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

/** "13/06/2026 - 08:00" */
export function formatDateTimeVN(date?: Date | string | null): string {
  if (!date) return '-'
  const d = new Date(date)
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${formatDateVN(d)} - ${hh}:${min}`
}

/** "2,713" */
export function formatNumber(n: number): string {
  return n.toLocaleString('vi-VN')
}

/** Che số điện thoại: "0901234567" -> "*****34567" (giữ 5 số cuối) */
export function maskPhone(phone?: string | null): string {
  if (!phone) return '-'
  if (phone.length <= 5) return phone
  return '*'.repeat(phone.length - 5) + phone.slice(-5)
}
