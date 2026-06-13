/** Hằng số danh mục dùng chung cho cả client lẫn server (không phụ thuộc mongoose). */

export const CATEGORY_TYPES = [
  'age',
  'province',
  'quote',
  'source',
  'service',
  'result',
] as const

export type CategoryType = (typeof CATEGORY_TYPES)[number]

export const CATEGORY_LABELS: Record<CategoryType, string> = {
  age: 'Độ tuổi',
  province: 'Tỉnh',
  quote: 'Báo giá',
  source: 'Nguồn',
  service: 'Dịch vụ',
  result: 'Kết quả',
}

/** Nhãn lựa chọn mặc định "Tất cả ..." cho mỗi bộ lọc. */
export const CATEGORY_ALL_LABELS: Record<CategoryType, string> = {
  age: 'Tất cả độ tuổi',
  province: 'Tất cả tỉnh',
  quote: 'Tất cả báo giá',
  source: 'Tất cả nguồn',
  service: 'Tất cả dịch vụ',
  result: 'Tất cả kết quả',
}
