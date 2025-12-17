# 🚀 Hướng dẫn Setup Nhanh

## Thông tin đã cấu hình
- **Database User:** root
- **Database Password:** 18042005
- **Database Name:** task_management

## Bước 1: Tạo User root trong PostgreSQL (Nếu chưa có)

Mở terminal và chạy:

```bash
# Kết nối với PostgreSQL bằng user postgres (user mặc định)
psql -U postgres

# Trong psql, chạy các lệnh sau:
CREATE USER root WITH PASSWORD '18042005';
ALTER USER root CREATEDB;
\q
```

**Lưu ý:** Nếu bạn không có quyền truy cập user `postgres`, hãy:
1. Sử dụng user khác bạn có quyền (ví dụ: user hiện tại của bạn)
2. Hoặc sửa file `.env` và dùng user đó

## Bước 2: Tạo Database

```bash
cd backend
npm run init-db
```

Nếu thành công, bạn sẽ thấy:
```
✅ Kết nối PostgreSQL thành công
✅ Đã tạo database: task_management
```

## Bước 3: Tạo Admin User

```bash
npm run create-admin
```

Thông tin đăng nhập admin:
- **Email:** admin@example.com
- **Password:** admin123

## Bước 4: Chạy Backend Server

```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:5000`

## Bước 5: Chạy Frontend

Mở terminal mới:

```bash
cd frontend
npm install
npm run dev
```

Frontend sẽ chạy tại `http://localhost:3000`

## ✅ Hoàn tất!

Bây giờ bạn có thể:
1. Mở trình duyệt và vào `http://localhost:3000`
2. Đăng nhập với `admin@example.com` / `admin123`
3. Hoặc đăng ký tài khoản mới

---

## 🔧 Troubleshooting

### Lỗi: "password authentication failed"
- Kiểm tra mật khẩu trong file `.env` có đúng không
- Kiểm tra PostgreSQL đang chạy: `pg_isready` hoặc `brew services list` (nếu dùng Homebrew)

### Lỗi: "role root does not exist"
- Tạo user root như Bước 1
- Hoặc sửa file `.env` và dùng user khác (ví dụ: postgres)

### Lỗi: "database does not exist"
- Chạy lại: `npm run init-db`

### Lỗi kết nối PostgreSQL
- Kiểm tra PostgreSQL đang chạy:
  - macOS (Homebrew): `brew services start postgresql`
  - Linux: `sudo systemctl start postgresql`
  - Windows: Kiểm tra Services

