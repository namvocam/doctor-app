/** Kiểu dữ liệu lịch hẹn dùng ở phía client. */
export interface Appointment {
  _id: string
  customerName: string
  age?: number
  phone?: string
  performAt: string
  doctor?: string
  surgery?: boolean
  address?: string
  province?: string
  service1?: string
  service2?: string
  test?: boolean
  telesaleNote?: string
  source?: string
  subSource?: string
  groupSource?: string
  telesale?: string
  telesaleCtv?: string
  sale1?: string
  sale2?: string
  quote?: string
  result?: string
  saleNote?: string
  media?: string
  mktNote?: string
  dataReceivedAt?: string
  createdAt?: string
  recording?: string
  revenue?: number
  highlight?: boolean
}

export type CategoryMap = Record<string, { label: string; options: string[] }>
