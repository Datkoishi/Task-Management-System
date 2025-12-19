# Backend - Task Management System

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Tạo file `.env` từ `.env.example` và điền thông tin database:
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=task_management
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
```

3. Chạy server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Đăng ký
- POST `/api/auth/login` - Đăng nhập
- GET `/api/auth/me` - Lấy thông tin user hiện tại

### Tasks
- GET `/api/tasks` - Lấy danh sách tasks
- GET `/api/tasks/stats` - Lấy thống kê
- GET `/api/tasks/:id` - Lấy chi tiết task
- POST `/api/tasks` - Tạo task mới
- PUT `/api/tasks/:id` - Cập nhật task
- DELETE `/api/tasks/:id` - Xóa task
- PUT `/api/tasks/:taskId/checklists/:checklistId` - Cập nhật checklist

### Admin
- GET `/api/admin/users` - Lấy danh sách users
- GET `/api/admin/users/:id` - Lấy chi tiết user
- PUT `/api/admin/users/:id` - Cập nhật user
- DELETE `/api/admin/users/:id` - Xóa user
- GET `/api/admin/tasks` - Lấy tất cả tasks





