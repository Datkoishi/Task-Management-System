#!/bin/bash

# Script tạo user root trong PostgreSQL
# Chạy: bash scripts/createUser.sh

echo "🔧 Tạo user root trong PostgreSQL..."
echo ""

# Thử kết nối với postgres user
psql -U postgres <<EOF
CREATE USER root WITH PASSWORD '18042005';
ALTER USER root CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE postgres TO root;
\du
\q
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Tạo user root thành công!"
    echo ""
    echo "💡 Tiếp theo, chạy:"
    echo "   npm run init-db"
else
    echo ""
    echo "❌ Lỗi! Có thể do:"
    echo "   - User root đã tồn tại"
    echo "   - Không có quyền truy cập user postgres"
    echo "   - PostgreSQL chưa chạy"
    echo ""
    echo "💡 Thử kết nối thủ công:"
    echo "   psql -U postgres"
    echo "   CREATE USER root WITH PASSWORD '18042005';"
    echo "   ALTER USER root CREATEDB;"
fi

