# 🔌 Hướng dẫn kết nối Query Tool trong pgAdmin

Bạn đang ở Query Tool! Điền thông tin như sau:

## 📝 Điền thông tin vào form:

### Server Name (Bắt buộc - phải điền!)
```
Task Management Server
```
hoặc bất kỳ tên nào bạn muốn (ví dụ: `Local PostgreSQL`)

### Host name/address:
```
localhost
```
hoặc
```
127.0.0.1
```

### Port:
```
5432
```
(port mặc định của PostgreSQL)

### Database:
```
postgres
```
(Nếu chưa tạo database `task_management`, dùng `postgres` trước)

### User:
```
postgres
```
(hoặc user bạn đang dùng để truy cập PostgreSQL)

### Password:
Nhập password của user postgres (nếu có)

### Role:
Để trống hoặc chọn từ dropdown nếu có

### Service:
Để trống

---

## ✅ Sau khi điền xong:

1. Click nút **"Connect & Open Query Tool"** (nút xanh ở góc dưới phải)

2. Nếu kết nối thành công, bạn sẽ thấy Query Editor

---

## 🎯 Tiếp theo - Tạo User root:

Sau khi kết nối thành công, trong Query Editor, chạy lệnh sau:

```sql
-- Tạo user root
CREATE USER root WITH PASSWORD '18042005';

-- Cấp quyền
ALTER USER root CREATEDB;
```

Sau đó click **Execute** (▶️) hoặc nhấn **F5**

---

## 🎯 Tạo Database task_management:

```sql
-- Tạo database với owner là root
CREATE DATABASE task_management OWNER root;
```

---

## 🎯 Kết nối lại với database task_management:

1. Trong Query Tool, click vào dropdown "Database" (góc trên bên phải)
2. Chọn `task_management`
3. Hoặc mở Query Tool mới và điền form với:
   - Server Name: `Task Management Server`
   - Host: `localhost`
   - Port: `5432`
   - Database: `task_management`
   - User: `root`
   - Password: `18042005`

---

## 🎯 Tạo các bảng:

1. Mở file: `backend/database/runSchema.sql`
2. Copy toàn bộ nội dung
3. Paste vào Query Editor
4. Click Execute (▶️) hoặc nhấn F5

---

## ✅ Hoàn tất!

Sau đó chạy:
```bash
cd backend
npm run create-admin
npm run dev
```

