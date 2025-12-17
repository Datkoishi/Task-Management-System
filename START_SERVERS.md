# 🚀 Hướng dẫn chạy Server

## Backend Server

```bash
cd backend
npm run dev
```

Server sẽ chạy tại: `http://localhost:5000`

## Frontend Server

Mở Terminal mới:

```bash
cd frontend
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:3000`

---

## ✅ Thông tin đăng nhập

- **Email:** admin@example.com
- **Password:** admin123

---

## 🔧 Nếu gặp lỗi "Port already in use"

**Dừng process đang dùng port:**
```bash
# Kill process trên port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process trên port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

**Hoặc dừng tất cả Node processes:**
```bash
pkill -f nodemon
pkill -f "node.*server"
```

---

## 📝 Lưu ý

- Backend và Frontend cần chạy **đồng thời** trong 2 terminal riêng
- Đảm bảo PostgreSQL đang chạy trước khi start backend
- Nếu thay đổi code, nodemon sẽ tự động restart backend

