const { Sequelize } = require('sequelize');
require('dotenv').config();

async function fixPermissions() {
  // Kết nối với user postgres (có full permission) để cấp quyền cho root
  const sequelize = new Sequelize(
    process.env.DB_NAME || 'task_management',
    'postgres', // Dùng postgres user để có quyền GRANT
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

    const dbName = process.env.DB_NAME || 'task_management';
    
    // Cấp quyền cho user root
    console.log('🔧 Đang cấp quyền cho user root...\n');

    const queries = [
      `GRANT ALL ON SCHEMA public TO root`,
      `GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO root`,
      `GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO root`,
      `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO root`,
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO root`,
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO root`,
    ];

    for (const query of queries) {
      try {
        await sequelize.query(query);
        console.log(`✅ ${query}`);
      } catch (error) {
        // Một số lệnh có thể đã được chạy trước đó, không sao
        if (!error.message.includes('already exists') && !error.message.includes('does not exist')) {
          console.log(`⚠️  ${query}`);
          console.log(`   Lỗi: ${error.message}`);
        }
      }
    }

    await sequelize.close();
    console.log('\n🎉 Cấp quyền thành công!');
    console.log('💡 Bây giờ bạn có thể đăng ký user mới\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    if (error.name === 'SequelizeConnectionError') {
      console.error('\n💡 Gợi ý:');
      console.error('   1. Đảm bảo PostgreSQL đang chạy');
      console.error('   2. User postgres có password không?');
      console.error('   3. Hoặc chạy script SQL trong pgAdmin Query Tool\n');
      console.error('   Mở file: backend/FIX_PERMISSIONS.sql\n');
    }
    process.exit(1);
  }
}

fixPermissions();

