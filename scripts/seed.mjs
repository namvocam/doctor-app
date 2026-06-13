import pkg from '@next/env'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const { loadEnvConfig } = pkg
loadEnvConfig(process.cwd())

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error('❌ Thiếu MONGODB_URI trong .env.local')
  process.exit(1)
}

// --- Schemas (định nghĩa lại tối giản để dùng trong script độc lập) ---
const userSchema = new mongoose.Schema(
  {
    username: String,
    passwordHash: String,
    name: String,
    role: String,
  },
  { timestamps: true }
)
const appointmentSchema = new mongoose.Schema(
  {
    customerName: String,
    age: Number,
    phone: String,
    performAt: Date,
    doctor: String,
    surgery: Boolean,
    address: String,
    province: String,
    service1: String,
    service2: String,
    test: Boolean,
    telesaleNote: String,
    source: String,
    quote: String,
    result: String,
    dataReceivedAt: Date,
    highlight: Boolean,
  },
  { timestamps: true }
)
const reExamSchema = new mongoose.Schema(
  {
    customerName: String,
    phone: String,
    reExamDate: Date,
    time: String,
    status: String,
    service: String,
    surgeryDate: Date,
    media: String,
    doctor: String,
    sale1: String,
  },
  { timestamps: true }
)

const User = mongoose.models.User ?? mongoose.model('User', userSchema)
const Appointment =
  mongoose.models.Appointment ?? mongoose.model('Appointment', appointmentSchema)
const ReExam = mongoose.models.ReExam ?? mongoose.model('ReExam', reExamSchema)

// --- Helpers ---
const DOCTOR = 'Bs. Đinh Khanh'
const SERVICES = ['Nâng ngực', 'Hút eo', 'Tạo hình thành bụng', 'Treo sa trễ', 'Nâng mũi', 'Cắt mí']
const PROVINCES = ['Hà Nội', 'Sài Gòn']
const SOURCES = ['Facebook', 'Zalo', 'Website', 'Giới thiệu', 'TikTok']
const SALES = ['Trần Thị Kim Anh', 'Hoàng Thị Hậu', 'Nguyễn Thị Mai']

function daysFromNow(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(8 + (Math.abs(n) % 8), 0, 0, 0)
  return d
}
function pick(arr, i) {
  return arr[i % arr.length]
}
function maskPhone(p) {
  return p
}

const CUSTOMERS = [
  ['Trần Thị Thu', 27, '0901111332'],
  ['Vũ Thị Thuỳ', 35, '0908805123'],
  ['Hồng Khánh', 41, '0912345678'],
  ['Hoàng Lan Anh', 29, '0934567890'],
  ['Nguyễn Thị Hà', 38, '0945678901'],
  ['Phạm Thu Trang', 31, '0956789012'],
  ['Lê Thị Hoa', 26, '0967890123'],
  ['Đỗ Minh Châu', 44, '0978901234'],
  ['Bùi Thị Duyên', 33, '0950385221'],
  ['Bùi Thu Trang', 28, '0911889334'],
  ['Trịnh Thị Thảo', 36, '0922334455'],
  ['Dương Thị Thanh Loan', 30, '0933445566'],
  ['Phan Lê Mỹ Linh', 24, '0944556677'],
  ['Nguyễn Ánh Thư', 39, '0955667788'],
  ['Quyên Nguyễn', 32, '0966778899'],
]

function buildAppointments() {
  return CUSTOMERS.map((c, i) => ({
    customerName: c[0],
    age: c[1],
    phone: maskPhone(c[2]),
    performAt: daysFromNow(i % 4 === 0 ? 0 : i - 7),
    doctor: DOCTOR,
    surgery: i % 3 !== 0,
    address: pick(['Đê La Thành - Hà Nội', 'Sơn La - Sơn La', 'Hải Phòng', 'Bình Dương', 'Quận 1 - HCM'], i),
    province: pick(PROVINCES, i),
    service1: pick(SERVICES, i),
    service2: i % 2 === 0 ? pick(SERVICES, i + 2) : '',
    test: i % 2 === 0,
    telesaleNote: pick(
      [
        'Loại KH: sale Oanh chốt 16tr. Mổ CA 1...',
        'Tạo hình bụng toàn thể...',
        'KH hẹn tư vấn lại tuần sau',
        'Đã cọc 5tr giữ lịch',
        'Cần tư vấn thêm về chi phí',
      ],
      i
    ),
    source: pick(SOURCES, i),
    quote: i % 2 === 0 ? `${10 + i}tr` : 'Chưa báo giá',
    result: pick(['Đã chốt', 'Đang tư vấn', 'Hẹn lại', 'Từ chối'], i),
    dataReceivedAt: daysFromNow(-(i + 10)),
    highlight: i % 4 === 0,
  }))
}

function buildReExams() {
  const statuses = ['Phàn nàn', 'Đã lên lịch', 'Quá hạn', 'Đã tái khám', 'Đã lên lịch', 'Quá hạn', 'Phàn nàn']
  return CUSTOMERS.slice(0, 12).map((c, i) => ({
    customerName: c[0],
    phone: maskPhone(c[2]),
    reExamDate: daysFromNow(i % 3 === 0 ? 0 : i - 5),
    time: pick(['08:00', '08:30', '09:00', '10:00', '14:00', '15:30'], i),
    status: pick(statuses, i),
    service: 'Khác: BH ' + pick(['mũi', 'tháo túi ngực', 'nâng ngực', 'hút mỡ'], i),
    surgeryDate: daysFromNow(-(i + 20)),
    media: pick(['KSDHA', 'Media HN', 'Media SG'], i),
    doctor: DOCTOR,
    sale1: pick(SALES, i),
  }))
}

async function main() {
  console.log('⏳ Kết nối MongoDB...')
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 })
  console.log('✅ Đã kết nối:', mongoose.connection.name)

  // Users
  await User.deleteMany({})
  const users = [
    { username: 'bskhanh', password: '123456', name: 'BS. Đinh Khanh', role: 'admin' },
    { username: 'ads', password: 'ads123', name: 'ADS ads', role: 'ads' },
  ]
  for (const u of users) {
    await User.create({
      username: u.username,
      passwordHash: await bcrypt.hash(u.password, 10),
      name: u.name,
      role: u.role,
    })
  }
  console.log(`✅ Đã tạo ${users.length} tài khoản`)

  // Appointments
  await Appointment.deleteMany({})
  const appts = buildAppointments()
  await Appointment.insertMany(appts)
  console.log(`✅ Đã tạo ${appts.length} lịch hẹn`)

  // ReExams
  await ReExam.deleteMany({})
  const reexams = buildReExams()
  await ReExam.insertMany(reexams)
  console.log(`✅ Đã tạo ${reexams.length} lịch tái khám`)

  console.log('\n🎉 Seed hoàn tất!')
  console.log('   Đăng nhập: bskhanh / 123456  (admin)')
  console.log('             ads / ads123       (ads)')

  await mongoose.disconnect()
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Seed thất bại:', err)
  process.exit(1)
})
