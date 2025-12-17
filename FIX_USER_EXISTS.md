# ✅ User root đã tồn tại - Không sao cả!

## Giải pháp:

### Cách 1: Chỉ chạy phần tạo database (Khuyến nghị)

Trong Query Editor, **xóa** hoặc **comment** 2 dòng đầu (tạo user), chỉ giữ lại:

```sql
-- User root đã tồn tại, bỏ qua phần tạo user

-- Đảm bảo user root có quyền tạo database (chạy lại cũng không sao)
ALTER USER root CREATEDB;

-- Tạo database
CREATE DATABASE task_management OWNER root;
```

**Hoặc đơn giản hơn, chỉ chạy:**

```sql
CREATE DATABASE task_management OWNER root;
```

---

### Cách 2: Sử dụng IF NOT EXISTS (PostgreSQL 9.5+)

```sql
-- Tạo database nếu chưa tồn tại
SELECT 'CREATE DATABASE task_management OWNER root'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'task_management')\gexec
```

---

## Bước tiếp theo sau khi tạo database thành công:

1. **Kết nối với database task_management:**
   - Click vào dropdown "Database" (góc trên phải)
   - Chọn "task_management"
   - Password: `18042005`

2. **Tạo các bảng:**
   - Mở file `backend/database/runSchema.sql`
   - Copy toàn bộ và paste vào Query Editor
   - Click Execute (▶️)

3. **Chạy script tạo admin:**
   ```bash
   cd backend
   npm run create-admin
   ```

---

## Lưu ý:

- User root đã tồn tại là **tốt**, không cần làm gì thêm
- Chỉ cần tạo database `task_management` là đủ
- Nếu database đã tồn tại, bạn sẽ thấy lỗi tương tự - cũng không sao!

