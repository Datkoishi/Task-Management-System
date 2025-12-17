const { Sequelize } = require('sequelize');
require('dotenv').config();

// Kết nối đến PostgreSQL server (không chỉ định database)
const sequelize = new Sequelize(
  'postgres', // database mặc định
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
  }
);

async function initDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Kết nối PostgreSQL thành công');

    const dbName = process.env.DB_NAME || 'task_management';
    
    // Kiểm tra xem database đã tồn tại chưa
    const [results] = await sequelize.query(
      `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`
    );

    if (results.length === 0) {
      // Tạo database
      await sequelize.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Đã tạo database: ${dbName}`);
    } else {
      console.log(`ℹ️  Database ${dbName} đã tồn tại`);
    }

    await sequelize.close();
    console.log('\n🎉 Khởi tạo database thành công!');
    console.log('💡 Tiếp theo, chạy: npm run create-admin\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    console.error('\n💡 Có thể do:');
    console.error('   1. PostgreSQL chưa chạy');
    console.error('   2. User "root" chưa tồn tại trong PostgreSQL');
    console.error('   3. Mật khẩu không đúng');
    console.error('\n🔧 Giải pháp:');
    console.error('   Nếu user "root" chưa tồn tại, tạo user bằng lệnh:');
    console.error('   psql -U postgres');
    console.error('   CREATE USER root WITH PASSWORD \'18042005\';');
    console.error('   ALTER USER root CREATEDB;');
    console.error('   \\q');
    console.error('\n   Hoặc sử dụng user postgres và cập nhật file .env\n');
    process.exit(1);
  }
}

initDatabase();

