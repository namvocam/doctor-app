/**
 * Cấu hình tập trung.
 *
 * ⚠️ CẢNH BÁO BẢO MẬT: các giá trị mặc định bên dưới được nhúng thẳng vào
 * source code để app chạy được ngay cả khi không có file .env.local
 * (ví dụ khi deploy). Vì repo có thể public trên GitHub nên những giá trị
 * này coi như bị lộ — hãy đổi mật khẩu MongoDB và SESSION_SECRET khi cần.
 *
 * Biến môi trường (process.env) luôn được ưu tiên nếu tồn tại.
 */

const DEFAULT_MONGODB_URI =
  'mongodb://ntlnamvocam1997_db_user:abcd1234@ac-sly24og-shard-00-00.w53lskt.mongodb.net:27017,ac-sly24og-shard-00-01.w53lskt.mongodb.net:27017,ac-sly24og-shard-00-02.w53lskt.mongodb.net:27017/doctor-app?ssl=true&replicaSet=atlas-3w0t00-shard-0&authSource=admin&retryWrites=true&w=majority'

const DEFAULT_SESSION_SECRET = 'trung-anh-group-secret-key-doi-trong-production-32chars'

export const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_MONGODB_URI

export const SESSION_SECRET = process.env.SESSION_SECRET || DEFAULT_SESSION_SECRET
