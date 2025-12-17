# 🔧 Sửa lỗi 500 khi đăng ký

## Nguyên nhân:
Có thể do user `root` chưa có quyền INSERT vào bảng `users`.

## Giải pháp:

### Bước 1: Cấp quyền trong pgAdmin

1. Mở Query Tool của database `task_management`
2. Copy và chạy script từ file `backend/FIX_PERMISSIONS.sql`
3. Hoặc chạy trực tiếp:

```sql
-- Cấp quyền cho user root
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO root;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO root;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO root;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO root;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO root;
```

4. Click Execute (▶️)

### Bước 2: Kiểm tra lại

Thử đăng ký lại trên trang web.

---

## Hoặc sử dụng user postgres (Nếu cách trên không work)

Sửa file `.env` trong `backend`:

```
DB_USER=postgres
DB_PASSWORD=<password_cua_postgres>
```

Sau đó restart backend server.

