# 🎯 Hướng dẫn Setup PostgreSQL với pgAdmin 4

Bạn đã có pgAdmin 4 rồi! Đây là hướng dẫn chi tiết từng bước:

---

## Bước 1: Tạo Server Connection trong pgAdmin

1. **Trong pgAdmin, click vào "Add New Server"** (nút có 2 server icon xếp chồng)

2. **Tab "General":**
   - **Name:** `Task Management Server` (hoặc tên bạn muốn)

3. **Tab "Connection":**
   - **Host name/address:** `localhost` hoặc `127.0.0.1`
   - **Port:** `5432` (port mặc định của PostgreSQL)
   - **Maintenance database:** `postgres`
   - **Username:** `postgres` (user mặc định, hoặc user bạn đang dùng)
   - **Password:** Nhập password của user postgres (nếu có)
   - ✅ **Save password** (đánh dấu để không phải nhập lại)

4. Click **"Save"**

---

## Bước 2: Tạo User "root"

1. **Mở rộng server vừa tạo** trong cây bên trái:
   - `Servers` → `Task Management Server` → `Login/Group Roles`

2. **Click chuột phải vào "Login/Group Roles"** → **Create** → **Login/Group Role...**

3. **Tab "General":**
   - **Name:** `root`

4. **Tab "Definition":**
   - **Password:** `18042005`
   - ✅ **Can login?** (đánh dấu)

5. **Tab "Privileges":**
   - ✅ **Can create databases?** (đánh dấu)
   - ✅ **Can create roles?** (có thể bỏ qua)

6. Click **"Save"**

---

## Bước 3: Tạo Database "task_management"

1. **Click chuột phải vào "Databases"** → **Create** → **Database...**

2. **Tab "General":**
   - **Database:** `task_management`
   - **Owner:** Chọn `root` từ dropdown

3. Click **"Save"**

---

## Bước 4: Kết nối với Database mới

1. **Mở rộng "Databases"** → Click vào `task_management`
2. **Click chuột phải** → **Disconnect Server** (nếu đang connect với user khác)
3. **Click chuột phải vào "Task Management Server"** → **Properties**
4. **Tab "Connection":**
   - **Username:** `root`
   - **Password:** `18042005`
5. Click **"Save"**

---

## Bước 5: Tạo các bảng (Tables)

Có 2 cách:

### Cách 1: Dùng SQL Script (Khuyến nghị)

1. **Click vào database `task_management`** trong cây bên trái
2. **Click vào tab "Query Tool"** (icon SQL ở trên)
3. **Mở file:** `backend/database/schema.sql`
4. **Copy toàn bộ nội dung** và paste vào Query Tool
5. **Click nút "Execute"** (▶️) hoặc nhấn F5
6. Kiểm tra kết quả ở tab "Messages" - sẽ thấy "Query returned successfully"

### Cách 2: Dùng Sequelize tự động (Nếu cách 1 không work)

Sequelize sẽ tự động tạo tables khi bạn chạy server.

---

## Bước 6: Tạo Admin User (Sử dụng Node.js)

Sau khi đã có database và tables, chạy:

```bash
cd backend
npm run create-admin
```

Nếu thành công, bạn sẽ thấy:
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
cd backend
npm run dev
```

Server sẽ chạy tại `http://localhost:5000`

---

## Kiểm tra kết quả

Trong pgAdmin:
1. Mở rộng `task_management` → `Schemas` → `public` → `Tables`
2. Bạn sẽ thấy các bảng:
   - `users`
   - `tasks`
   - `checklists`
   - `task_assignments`
   - `attachments`

3. Click chuột phải vào `users` → **View/Edit Data** → **All Rows**
4. Bạn sẽ thấy user admin đã được tạo

---

## Troubleshooting

### Lỗi: "password authentication failed"
- Kiểm tra lại password của user postgres
- Hoặc tạo user root với password khác và cập nhật file `.env`

### Lỗi: "database does not exist"
- Kiểm tra database `task_management` đã được tạo chưa
- Hoặc tạo database trong pgAdmin như Bước 3

### Lỗi kết nối từ Node.js
- Đảm bảo file `.env` có đúng thông tin:
  ```
  DB_HOST=localhost
  DB_PORT=5432
  DB_NAME=task_management
  DB_USER=root
  DB_PASSWORD=18042005
  ```

---

## ✅ Xong rồi!

Bây giờ bạn có thể:
1. Chạy backend: `cd backend && npm run dev`
2. Chạy frontend: `cd frontend && npm run dev`
3. Mở trình duyệt: `http://localhost:3000`
4. Đăng nhập với: `admin@example.com` / `admin123`

