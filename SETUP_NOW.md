# ⚡ Setup Ngay Bây Giờ

## 🚨 PostgreSQL chưa được cài đặt hoặc chưa chạy!

Bạn cần cài đặt PostgreSQL trước. Chọn một trong các cách sau:

---

## 🎯 Cách Nhanh Nhất: Homebrew

### 1. Cài đặt PostgreSQL
```bash
brew install postgresql
```

### 2. Khởi động PostgreSQL
```bash
brew services start postgresql
```

### 3. Tạo user root
```bash
psql postgres
```

Sau đó trong psql, chạy:
```sql
CREATE USER root WITH PASSWORD '18042005';
ALTER USER root CREATEDB;
\q
```

### 4. Setup database
```bash
cd backend
npm run init-db
npm run create-admin
npm run dev
```

---

## 🐳 Hoặc dùng Docker (Nếu đã có Docker)

```bash
# Chạy PostgreSQL
docker run --name postgres-task \
  -e POSTGRES_USER=root \
  -e POSTGRES_PASSWORD=18042005 \
  -e POSTGRES_DB=task_management \
  -p 5432:5432 \
  -d postgres:15

# Chờ vài giây để PostgreSQL khởi động
sleep 5

# Setup backend
cd backend
npm run create-admin
npm run dev
```

---

## 📱 Hoặc dùng Postgres.app (GUI dễ dùng)

1. Tải về: https://postgresapp.com/
2. Cài đặt và mở app
3. Click "Initialize"
4. Mở Terminal:
   ```bash
   /Applications/Postgres.app/Contents/Versions/latest/bin/psql postgres
   CREATE USER root WITH PASSWORD '18042005';
   ALTER USER root CREATEDB;
   \q
   ```
5. Setup:
   ```bash
   cd backend
   npm run init-db
   npm run create-admin
   npm run dev
   ```

---

## ✅ Sau khi cài đặt PostgreSQL

Chạy các lệnh sau:

```bash
cd backend
npm run init-db      # Tạo database
npm run create-admin  # Tạo admin user
npm run dev          # Chạy server
```

Trong terminal khác:
```bash
cd frontend
npm install
npm run dev
```

---

## 🆘 Cần giúp đỡ?

Xem file `INSTALL_POSTGRESQL.md` để biết hướng dẫn chi tiết hơn!

