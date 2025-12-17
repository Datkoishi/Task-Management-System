# 📦 Hướng dẫn cài đặt PostgreSQL trên macOS

## Cách 1: Cài đặt bằng Homebrew (Khuyến nghị)

### Bước 1: Cài đặt Homebrew (nếu chưa có)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Bước 2: Cài đặt PostgreSQL
```bash
brew install postgresql@15
```

Hoặc phiên bản mới nhất:
```bash
brew install postgresql
```

### Bước 3: Khởi động PostgreSQL
```bash
brew services start postgresql@15
```

Hoặc:
```bash
brew services start postgresql
```

### Bước 4: Thêm PostgreSQL vào PATH
Thêm vào file `~/.zshrc` hoặc `~/.bash_profile`:

```bash
# PostgreSQL
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
```

Hoặc nếu dùng Intel Mac:
```bash
export PATH="/usr/local/opt/postgresql@15/bin:$PATH"
```

Sau đó:
```bash
source ~/.zshrc  # hoặc source ~/.bash_profile
```

### Bước 5: Tạo user root
```bash
psql postgres
```

Trong psql:
```sql
CREATE USER root WITH PASSWORD '18042005';
ALTER USER root CREATEDB;
\q
```

### Bước 6: Tạo database
```bash
cd backend
npm run init-db
```

---

## Cách 2: Cài đặt bằng Postgres.app (GUI)

1. Tải về từ: https://postgresapp.com/
2. Cài đặt và mở ứng dụng
3. Click "Initialize" để tạo server
4. Thêm vào PATH trong Terminal:
   ```bash
   sudo mkdir -p /etc/paths.d &&
   echo /Applications/Postgres.app/Contents/Versions/latest/bin | sudo tee /etc/paths.d/postgresapp
   ```
5. Mở Terminal mới và chạy:
   ```bash
   psql postgres
   CREATE USER root WITH PASSWORD '18042005';
   ALTER USER root CREATEDB;
   \q
   ```

---

## Cách 3: Cài đặt bằng Docker

### Bước 1: Cài đặt Docker Desktop
Tải từ: https://www.docker.com/products/docker-desktop

### Bước 2: Chạy PostgreSQL container
```bash
docker run --name postgres-task -e POSTGRES_PASSWORD=18042005 -e POSTGRES_USER=root -p 5432:5432 -d postgres:15
```

### Bước 3: Tạo database
```bash
docker exec -it postgres-task psql -U root -c "CREATE DATABASE task_management;"
```

### Bước 4: Cập nhật file .env
Đảm bảo `.env` có:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=root
DB_PASSWORD=18042005
DB_NAME=task_management
```

---

## Kiểm tra cài đặt

Sau khi cài đặt, kiểm tra:
```bash
psql --version
pg_isready
```

Nếu thấy version number và "accepting connections" thì đã thành công!

---

## Sau khi cài đặt PostgreSQL

1. Tạo user root (nếu chưa có):
   ```bash
   psql postgres
   CREATE USER root WITH PASSWORD '18042005';
   ALTER USER root CREATEDB;
   \q
   ```

2. Chạy setup:
   ```bash
   cd backend
   npm run init-db
   npm run create-admin
   npm run dev
   ```

