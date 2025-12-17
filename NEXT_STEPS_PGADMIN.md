# ✅ Bước tiếp theo sau khi kết nối Query Tool

## Bước 1: Kết nối
Click nút **"Connect & Open Query Tool"** (nút xanh có icon database)

---

## Bước 2: Tạo User "root" trong Query Editor

Sau khi kết nối thành công, bạn sẽ thấy Query Editor. Copy và chạy lệnh sau:

```sql
-- Tạo user root
CREATE USER root WITH PASSWORD '18042005';

-- Cấp quyền tạo database
ALTER USER root CREATEDB;
```

**Cách chạy:**
1. Paste lệnh SQL vào Query Editor
2. Click nút **Execute** (▶️) hoặc nhấn **F5**
3. Kiểm tra kết quả ở tab "Messages" - sẽ thấy "Query returned successfully"

---

## Bước 3: Tạo Database "task_management"

Trong cùng Query Editor, chạy:

```sql
-- Tạo database với owner là root
CREATE DATABASE task_management OWNER root;
```

Click Execute (▶️) hoặc F5

---

## Bước 4: Kết nối với database task_management

### Cách 1: Dùng dropdown (Nhanh nhất)
1. Ở góc trên bên phải Query Editor, tìm dropdown "Database" (hiện đang là "postgres")
2. Click vào và chọn **"task_management"**
3. Nếu hỏi password, nhập: `18042005` (của user root)

### Cách 2: Mở Query Tool mới
1. Click phải vào database `task_management` trong cây bên trái
2. Chọn **Query Tool**
3. Hoặc dùng form kết nối với:
   - Database: `task_management`
   - User: `root`
   - Password: `18042005`

---

## Bước 5: Tạo các bảng (Tables)

1. **Mở file:** `backend/database/runSchema.sql`
2. **Copy toàn bộ nội dung** (Ctrl+A, Ctrl+C)
3. **Paste vào Query Editor** của database `task_management`
4. **Click Execute** (▶️) hoặc nhấn **F5**

Bạn sẽ thấy các bảng được tạo:
- ✅ users
- ✅ tasks
- ✅ checklists
- ✅ task_assignments
- ✅ attachments

---

## Bước 6: Tạo Admin User (Chạy trong Terminal)

Mở Terminal và chạy:

```bash
cd backend
npm run create-admin
```

Kết quả mong đợi:
```
✅ Kết nối database thành công
✅ Đồng bộ database thành công
✅ Tạo admin thành công!

📧 Thông tin đăng nhập:
   Email: admin@example.com
   Password: admin123
```

---

## Bước 7: Chạy Server

```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:5000`

---

## Bước 8: Chạy Frontend (Terminal mới)

```bash
cd frontend
npm install  # Nếu chưa cài
npm run dev
```

Frontend sẽ chạy tại `http://localhost:3000`

---

## ✅ Hoàn tất!

Bây giờ bạn có thể:
1. Mở trình duyệt: `http://localhost:3000`
2. Đăng nhập với: `admin@example.com` / `admin123`
3. Hoặc đăng ký tài khoản mới

---

## 🔍 Kiểm tra trong pgAdmin

Để xem data đã được tạo:
1. Mở rộng: `Servers` → `PostgreSQL 18` → `Databases` → `task_management` → `Schemas` → `public` → `Tables`
2. Click phải vào bảng `users` → **View/Edit Data** → **All Rows**
3. Bạn sẽ thấy user admin đã được tạo!

