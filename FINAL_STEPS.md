# ✅ Các bảng đã được tạo! Bước cuối cùng:

## Bước 1: Kiểm tra các bảng đã tạo

Trong pgAdmin, mở rộng cây bên trái:
- `task_management` → `Schemas` → `public` → `Tables`

Bạn sẽ thấy các bảng:
- ✅ users
- ✅ tasks
- ✅ checklists
- ✅ task_assignments
- ✅ attachments

**Nếu chưa thấy đầy đủ 5 bảng**, hãy chạy tiếp phần còn lại của script `runSchema.sql`

---

## Bước 2: Chạy script tạo Admin User

Mở Terminal và chạy:

```bash
cd "/Users/truongdat/Desktop/Task Management System/backend"
npm run create-admin
```

**Kết quả mong đợi:**
```
✅ Kết nối database thành công
✅ Đồng bộ database thành công
✅ Tạo admin thành công!

📧 Thông tin đăng nhập:
   Email: admin@example.com
   Password: admin123
```

---

## Bước 3: Chạy Backend Server

```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:5000`

Bạn sẽ thấy:
```
Kết nối database thành công
Đồng bộ database thành công
Server đang chạy tại port 5000
```

---

## Bước 4: Chạy Frontend (Terminal mới)

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

1. **Mở trình duyệt:** `http://localhost:3000`
2. **Đăng nhập với:**
   - Email: `admin@example.com`
   - Password: `admin123`
3. **Hoặc đăng ký tài khoản mới**

---

## 🔍 Kiểm tra Admin User trong pgAdmin (Tùy chọn)

1. Mở rộng: `task_management` → `Schemas` → `public` → `Tables` → `users`
2. Click phải vào `users` → **View/Edit Data** → **All Rows**
3. Bạn sẽ thấy user admin đã được tạo với email `admin@example.com`

