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
    status: String,
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
    subSource: String,
    groupSource: String,
    telesale: String,
    telesaleCtv: String,
    sale1: String,
    sale2: String,
    quote: String,
    result: String,
    saleNote: String,
    media: String,
    mktNote: String,
    dataReceivedAt: Date,
    recording: String,
    revenue: Number,
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
    preExamCondition: String,
    doctorInstruction: String,
    note: String,
  },
  { timestamps: true }
)

const categorySchema = new mongoose.Schema(
  {
    type: String,
    label: String,
    options: [String],
  },
  { timestamps: true }
)
const sourceRoleSchema = new mongoose.Schema(
  {
    source: String,
    role: String,
  },
  { timestamps: true }
)

const User = mongoose.models.User ?? mongoose.model('User', userSchema)
const Appointment =
  mongoose.models.Appointment ?? mongoose.model('Appointment', appointmentSchema)
const ReExam = mongoose.models.ReExam ?? mongoose.model('ReExam', reExamSchema)
const Category = mongoose.models.Category ?? mongoose.model('Category', categorySchema)
const SourceRole = mongoose.models.SourceRole ?? mongoose.model('SourceRole', sourceRoleSchema)

// Ánh xạ Nguồn -> vai trò báo cáo LEAD phẫu (nguồn 'none' sẽ không được tính doanh thu).
const SOURCE_ROLE_MAP = [
  { source: 'CTV', role: 'manager-collaborator' },
  { source: 'QUẢN LÝ CTV', role: 'manager-collaborator' },
  { source: 'QUẢN LÝ CTV - TIKTOK', role: 'tiktok' },
  { source: 'ADS', role: 'ads' },
  { source: 'ADS TIẾP CẬN', role: 'ads' },
  { source: 'SẢN PHẨM BÁN LẺ', role: 'none' },
  { source: 'Khách cũ giới thiệu', role: 'none' },
]

// --- Danh mục (admin có thể chỉnh ở /admin/categories) ---
const CATEGORY_DATA = [
  { type: 'age', label: 'Độ tuổi', options: ['Dưới 20', '20 - 30', '30 - 40', '40 - 50', '50 - 60', 'Trên 60'] },
  { type: 'province', label: 'Tỉnh', options: ['Hà Nội', 'Hồ Chí Minh', 'Bà Rịa–Vũng Tàu', 'Đà Nẵng', 'Quảng Ngãi', 'Quảng Nam'] },
  { type: 'quote', label: 'Báo giá', options: ['45-56', '50-80tr', '60-90tr', '10-20tr'] },
  { type: 'source', label: 'Nguồn', options: ['CTV', 'ADS', 'QUẢN LÝ CTV', 'QUẢN LÝ CTV - TIKTOK', 'ADS TIẾP CẬN', 'SẢN PHẨM BÁN LẺ', 'Khách cũ giới thiệu'] },
  { type: 'service', label: 'Dịch vụ', options: ['Nâng ngực', 'Hút mỡ', 'Combo ngoài', 'Combo trong', 'Combo trong ngoài', 'Nâng mũi', 'Dịch vụ khác'] },
  { type: 'result', label: 'Kết quả', options: ['Đã đặt lịch', 'Hủy lịch', 'Đã cọc', 'Failed', 'Bác sĩ từ chối', 'Phẫu thuật', 'Hoãn mổ'] },
]

const catOpts = (type) => CATEGORY_DATA.find((c) => c.type === type).options

// --- Helpers ---
const DOCTOR = 'Bs. Đinh Khanh'
const SERVICES = catOpts('service')
const PROVINCES = catOpts('province')
const SOURCES = catOpts('source')
const QUOTES = catOpts('quote')
const RESULTS = catOpts('result')
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

// Dữ liệu chuẩn: lịch hẹn từ 01/06/2026 đến 14/06/2026, mỗi ngày 3-5 bản ghi (cố định).
function buildAppointments() {
  const out = []
  let i = 0
  for (let day = 1; day <= 14; day++) {
    const count = 3 + (day % 3) // 3..5, cố định theo ngày
    for (let k = 0; k < count; k++) {
      const c = CUSTOMERS[i % CUSTOMERS.length]
      const result = pick(RESULTS, i)
      out.push({
        customerName: c[0],
        age: c[1],
        phone: c[2],
        performAt: new Date(2026, 5, day, 8 + (k % 9), (k % 2) * 30, 0, 0),
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
        subSource: pick(['Form', 'Inbox', 'Comment', 'Hotline'], i),
        groupSource: pick(['Group Sài Gòn', 'Group Hà Nội', 'Group VIP', ''], i),
        telesale: pick(['Ngọc Anh', 'Thu Hà', 'Mai Linh', 'Phương Anh'], i),
        telesaleCtv: pick(['CTV Lan', 'CTV Hương', '', 'CTV Tú'], i),
        sale1: pick(SALES, i),
        sale2: i % 3 === 0 ? pick(SALES, i + 1) : '',
        quote: pick(QUOTES, i),
        result,
        saleNote: pick(['KH tiềm năng cao', 'Đang so sánh giá', 'Hẹn tái tư vấn', 'Đã chuyển cọc', ''], i),
        media: pick(['KSDHA', 'Media HN', 'Media SG', 'Team Ads'], i),
        mktNote: pick(['Chạy ads FB', 'Lead TikTok', 'Remarketing', ''], i),
        dataReceivedAt: new Date(2026, 5, day, 0, 0, 0, 0),
        recording: '',
        revenue: result === 'Phẫu thuật' ? (12 + (i % 50)) * 1_000_000 : 0,
        highlight: false,
      })
      i++
    }
  }
  return out
}

function buildReExams(count = 84) {
  const statuses = ['Sắp tới', 'Quá hạn', 'Online', 'Phàn nàn', 'Xử lý vết thương', 'Đã huỷ', 'Sắp tới']
  return Array.from({ length: count }, (_, i) => {
    const c = CUSTOMERS[i % CUSTOMERS.length]
    const round = Math.floor(i / CUSTOMERS.length)
    return {
    customerName: round === 0 ? c[0] : `${c[0]} (${round + 1})`,
    phone: '0' + (900000000 + i * 211).toString().slice(0, 9),
    reExamDate: daysFromNow(i % 3 === 0 ? 0 : i - 5),
    time: pick(['08:00', '08:30', '09:00', '10:00', '14:00', '15:30'], i),
    status: pick(statuses, i),
    service: 'Khác: BH ' + pick(['mũi', 'tháo túi ngực', 'nâng ngực', 'hút mỡ'], i),
    surgeryDate: daysFromNow(-(i + 20)),
    media: pick(['KSDHA', 'Media HN', 'Media SG'], i),
    doctor: DOCTOR,
    sale1: pick(SALES, i),
    preExamCondition: pick(
      ['Vết mổ khô, ổn định', 'Còn sưng nhẹ vùng mổ', 'KH phản ánh đau ít', 'Bầm tím đang tan', ''],
      i
    ),
    doctorInstruction: pick(
      ['Tái khám sau 1 tuần', 'Uống kháng sinh 5 ngày', 'Chườm lạnh, nghỉ ngơi', 'Thay băng mỗi ngày', ''],
      i
    ),
    note: pick(['KH nhắn trực tiếp BS', 'Đã gọi nhắc lịch', 'Hẹn lại buổi chiều', ''], i),
    }
  })
}

async function main() {
  console.log('⏳ Kết nối MongoDB...')
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 })
  console.log('✅ Đã kết nối:', mongoose.connection.name)

  // Users
  await User.deleteMany({})
  const users = [
    { username: 'bskhanh', password: '123456', name: 'BS. Đinh Khanh', role: 'admin' },
    { username: 'ads', password: 'ads123', name: 'Nhân viên ADS', role: 'ads' },
    { username: 'tiktok', password: 'tiktok123', name: 'Nhân viên Tiktok', role: 'tiktok' },
    { username: 'ctv', password: 'ctv123', name: 'Quản lý CTV', role: 'manager-collaborator' },
    { username: 'telesale', password: 'tele123', name: 'Tele-sale', role: 'tele-sale' },
    { username: 'sale', password: 'sale123', name: 'Nhân viên Sale', role: 'sale' },
    { username: 'yta', password: 'yta123', name: 'Y tá', role: 'nurse' },
  ]
  for (const u of users) {
    await User.create({
      username: u.username,
      passwordHash: await bcrypt.hash(u.password, 10),
      name: u.name,
      role: u.role,
      status: 'active',
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

  // Categories (danh mục lọc)
  await Category.deleteMany({})
  await Category.insertMany(CATEGORY_DATA)
  console.log(`✅ Đã tạo ${CATEGORY_DATA.length} danh mục lọc`)

  // Source -> role (cho báo cáo LEAD phẫu)
  await SourceRole.deleteMany({})
  await SourceRole.insertMany(SOURCE_ROLE_MAP)
  console.log(`✅ Đã tạo ${SOURCE_ROLE_MAP.length} ánh xạ nguồn → vai trò`)

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
