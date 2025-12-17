# Hướng dẫn thiết lập Database

## Yêu cầu
- PostgreSQL đã được cài đặt và đang chạy
- Quyền tạo database

## Cách 1: Sử dụng Script tự động (Khuyến nghị)

1. Đảm bảo file `.env` đã được cấu hình đúng:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=task_management
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
```

2. Tạo database (nếu chưa có):
```bash
npm run init-db
```

3. Tạo admin user:
```bash
npm run create-admin
```

4. Chạy server:
```bash
npm run dev
```

Sequelize sẽ tự động tạo các bảng dựa trên models (vì có `sequelize.sync({ alter: true })` trong server.js).

## Cách 2: Sử dụng SQL Script thủ công

1. Kết nối vào PostgreSQL:
```bash
psql -U postgres
```

2. Tạo database và các bảng:
```bash
psql -U postgres -f database/schema.sql
```

Hoặc từng bước:
```sql
-- Tạo database
CREATE DATABASE task_management;

-- Kết nối vào database
\c task_management;

-- Chạy file schema
\i database/schema.sql
```

3. Tạo admin user:
```bash
node scripts/createAdmin.js
```

## Cách 3: Sử dụng pgAdmin hoặc công cụ GUI

1. Mở pgAdmin hoặc công cụ quản lý PostgreSQL
2. Tạo database mới tên `task_management`
3. Mở file `database/schema.sql` và chạy từng câu lệnh SQL
4. Chạy script tạo admin: `node scripts/createAdmin.js`

## Tạo Admin User

Sau khi database đã được tạo, chạy script để tạo tài khoản admin:

```bash
node scripts/createAdmin.js
```

Tài khoản admin mặc định:
- Email: `admin@example.com`
- Password: `admin123`

**Lưu ý:** Nên đổi mật khẩu sau lần đăng nhập đầu tiên!

## Kiểm tra Database

Để kiểm tra database đã được tạo đúng:

```bash
psql -U postgres -d task_management -c "\dt"
```

Sẽ hiển thị danh sách các bảng:
- users
- tasks
- checklists
- task_assignments
- attachments

## Troubleshooting

### Lỗi: "password authentication failed"
- Kiểm tra username và password trong file `.env`
- Đảm bảo PostgreSQL đang chạy

### Lỗi: "database does not exist"
- Tạo database trước bằng: `CREATE DATABASE task_management;`
- Hoặc để Sequelize tự tạo khi chạy server

### Lỗi: "relation already exists"
- Các bảng đã tồn tại, không cần tạo lại
- Có thể xóa database và tạo lại nếu cần reset

