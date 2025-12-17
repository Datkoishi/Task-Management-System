# Hướng dẫn Setup Nhanh

## Bước 1: Cài đặt Dependencies

```bash
cd backend
npm install
```

## Bước 2: Kiểm tra PostgreSQL

Đảm bảo PostgreSQL đang chạy:
```bash
# Kiểm tra PostgreSQL đang chạy
psql -U root -h localhost -c "SELECT version();"
```

Nếu lỗi "role root does not exist", bạn có 2 lựa chọn:

### Lựa chọn 1: Tạo user root (Khuyến nghị)
```bash
# Kết nối với user postgres (user mặc định)
psql -U postgres

# Tạo user root
CREATE USER root WITH PASSWORD '18042005';
ALTER USER root CREATEDB;
\q
```

### Lựa chọn 2: Sử dụng user postgres
Sửa file `.env`:
```
DB_USER=postgres
DB_PASSWORD=your_postgres_password
```

## Bước 3: Tạo Database

```bash
npm run init-db
```

## Bước 4: Tạo Admin User

```bash
npm run create-admin
```

Thông tin đăng nhập admin:
- Email: `admin@example.com`
- Password: `admin123`

## Bước 5: Chạy Server

```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:5000`

## Bước 6: Chạy Frontend

Mở terminal mới:
```bash
cd frontend
npm install
npm run dev
```

Frontend sẽ chạy tại `http://localhost:3000`

## Done! 🎉

Bây giờ bạn có thể:
1. Truy cập `http://localhost:3000`
2. Đăng nhập với admin@example.com / admin123
3. Hoặc đăng ký tài khoản mới

