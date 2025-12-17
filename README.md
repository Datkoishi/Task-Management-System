# Hệ Thống Quản Lý Nhiệm Vụ (Task Management System)

Hệ thống web quản lý nhiệm vụ được xây dựng với React + Node.js + PostgreSQL.

## Tính năng chính

- ✅ Đăng ký / Đăng nhập với JWT
- ✅ Bảng điều khiển với thống kê và biểu đồ
- ✅ Quản lý nhiệm vụ đầy đủ (CRUD)
- ✅ Checklist tự động cập nhật trạng thái
- ✅ Gán nhiệm vụ cho nhiều người dùng
- ✅ Theo dõi mức độ ưu tiên
- ✅ Xuất báo cáo (CSV, Excel, PDF)
- ✅ Link đính kèm
- ✅ Phân quyền Admin/User
- ✅ Responsive design

## Công nghệ

### Backend
- Node.js + Express.js
- PostgreSQL + Sequelize ORM
- JWT Authentication
- Bcrypt (mã hóa mật khẩu)

### Frontend
- React 18
- React Router DOM
- Tailwind CSS
- Recharts (biểu đồ)
- Axios
- Vite

## Cài đặt

### Backend

1. Vào thư mục backend:
```bash
cd backend
```

2. Cài đặt dependencies:
```bash
npm install
```

3. File `.env` đã được tạo sẵn với cấu hình:
```env
DB_USER=root
DB_PASSWORD=18042005
```

**Lưu ý:** Nếu PostgreSQL chưa có user `root`, bạn cần tạo:
```sql
-- Kết nối với user postgres
psql -U postgres

-- Tạo user root
CREATE USER root WITH PASSWORD '18042005';
ALTER USER root CREATEDB;
```

4. Tạo database:
```bash
npm run init-db
```

5. Tạo admin user:
```bash
npm run create-admin
```

Thông tin đăng nhập admin:
- Email: `admin@example.com`
- Password: `admin123`

6. Chạy server:
```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:5000`

### Frontend

1. Vào thư mục frontend:
```bash
cd frontend
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Chạy development server:
```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

## Sử dụng

1. Đăng ký tài khoản mới hoặc đăng nhập
2. Tạo nhiệm vụ mới từ trang "Nhiệm vụ"
3. Thêm checklist, gán người dùng, đặt mức độ ưu tiên
4. Theo dõi tiến độ trên Dashboard
5. Xuất báo cáo khi cần
6. Admin có thể quản lý users và xem tất cả tasks

## API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại

### Tasks
- `GET /api/tasks` - Lấy danh sách tasks
- `GET /api/tasks/stats` - Lấy thống kê
- `GET /api/tasks/:id` - Lấy chi tiết task
- `POST /api/tasks` - Tạo task mới
- `PUT /api/tasks/:id` - Cập nhật task
- `DELETE /api/tasks/:id` - Xóa task
- `PUT /api/tasks/:taskId/checklists/:checklistId` - Cập nhật checklist

### Admin
- `GET /api/admin/users` - Lấy danh sách users
- `GET /api/admin/users/:id` - Lấy chi tiết user
- `PUT /api/admin/users/:id` - Cập nhật user
- `DELETE /api/admin/users/:id` - Xóa user
- `GET /api/admin/tasks` - Lấy tất cả tasks

## Database Schema

- **users**: id, name, email, password, role, created_at
- **tasks**: id, title, description, priority, status, start_date, due_date, created_by
- **checklists**: id, task_id, title, is_completed
- **task_assignments**: id, task_id, user_id
- **attachments**: id, task_id, file_url

## Ghi chú

- Tất cả UI đều sử dụng tiếng Việt
- Database sẽ tự động tạo khi chạy server lần đầu
- Mật khẩu được mã hóa bằng bcrypt
- JWT token được lưu trong localStorage

