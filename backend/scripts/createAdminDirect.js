const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdminDirect() {
  // Kết nối trực tiếp với database
  const sequelize = new Sequelize(
    process.env.DB_NAME || 'task_management',
    'postgres', // Dùng postgres user để có full permission
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false,
    }
  );

  try {
    await sequelize.authenticate();
    console.log('✅ Kết nối database thành công');

    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Sử dụng raw query để insert
    const [results] = await sequelize.query(`
      INSERT INTO users (name, email, password, role, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (email) DO UPDATE 
      SET name = $1, password = $3, role = $4, updated_at = CURRENT_TIMESTAMP
      RETURNING id, name, email, role
    `, {
      bind: ['Quản trị viên', 'admin@example.com', hashedPassword, 'admin'],
      type: Sequelize.QueryTypes.INSERT
    });

    console.log('✅ Tạo admin thành công!');
    console.log('\n📧 Thông tin đăng nhập:');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123');
    console.log('\n⚠️  Lưu ý: Hãy đổi mật khẩu sau lần đăng nhập đầu tiên!\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    console.error('\n💡 Thử cách khác: Chạy file CREATE_ADMIN_SQL.sql trong pgAdmin Query Tool\n');
    process.exit(1);
  }
}

createAdminDirect();

