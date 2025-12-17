# ✅ Database đã tạo thành công! Bước tiếp theo:

## Bước 1: Kết nối với database task_management

1. **Ở góc trên bên phải Query Editor**, tìm dropdown "Database" (hiện đang là "postgres")
2. **Click vào dropdown** và chọn **"task_management"**
3. Nếu hỏi password, nhập: `18042005` (của user root)

**Hoặc cách khác:**
- Trong cây bên trái, mở rộng: `Servers` → `PostgreSQL 18` → `Databases`
- Click phải vào `task_management` → **Query Tool**

---

## Bước 2: Tạo các bảng (Tables)

1. **Mở file:** `backend/database/runSchema.sql`
   - Hoặc mở file: `SIMPLE_CREATE_DB.sql` trong cùng thư mục
   
2. **Copy toàn bộ nội dung** của file `runSchema.sql`

3. **Paste vào Query Editor** (đảm bảo đang kết nối với database `task_management`)

4. **Click Execute** (▶️) hoặc nhấn **F5**

5. **Kiểm tra kết quả:**
   - Tab "Messages" sẽ hiển thị: "Query returned successfully"
   - Bạn sẽ thấy các bảng được tạo:
     - ✅ users
     - ✅ tasks
     - ✅ checklists
     - ✅ task_assignments
     - ✅ attachments

---

## Bước 3: Kiểm tra trong pgAdmin

1. Mở rộng: `Servers` → `PostgreSQL 18` → `Databases` → `task_management` → `Schemas` → `public` → `Tables`
2. Bạn sẽ thấy 5 bảng đã được tạo!

---

## Bước 4: Tạo Admin User (Chạy trong Terminal)

Mở Terminal và chạy:

```bash
cd "/Users/truongdat/Desktop/Task Management System/backend"
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

## Bước 5: Chạy Backend Server

```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:5000`

---

## Bước 6: Chạy Frontend (Terminal mới)

Mở Terminal mới:

```bash
cd "/Users/truongdat/Desktop/Task Management System/frontend"
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

## 🔍 Kiểm tra Admin User trong pgAdmin

1. Mở rộng: `task_management` → `Schemas` → `public` → `Tables` → `users`
2. Click phải vào `users` → **View/Edit Data** → **All Rows**
3. Bạn sẽ thấy user admin đã được tạo!

