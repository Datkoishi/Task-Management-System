const fs = require('fs');
const path = require('path');

// Thông tin cấu hình
const envContent = `PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=task_management
DB_USER=root
DB_PASSWORD=18042005
JWT_SECRET=task_management_secret_key_2024_change_in_production
JWT_EXPIRE=7d
`;

const envPath = path.join(__dirname, '..', '.env');

console.log('🚀 Bắt đầu setup...\n');

// Tạo file .env
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Đã tạo file .env');
} else {
  console.log('ℹ️  File .env đã tồn tại');
  console.log('   Bạn có muốn ghi đè? (y/n)');
  // Trong production, có thể hỏi confirmation
  // Ở đây chúng ta chỉ thông báo
}

console.log('\n📋 Thông tin cấu hình:');
console.log('   DB_USER=root');
console.log('   DB_PASSWORD=18042005');
console.log('   DB_NAME=task_management');
console.log('\n💡 Tiếp theo, chạy các lệnh sau:');
console.log('   1. npm run init-db     (Tạo database)');
console.log('   2. npm run create-admin (Tạo admin user)');
console.log('   3. npm run dev         (Chạy server)\n');

