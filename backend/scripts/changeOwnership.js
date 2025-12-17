const { Sequelize } = require('sequelize');
require('dotenv').config();

async function changeOwnership() {
  // Kết nối với user postgres (có full permission) để đổi owner
  const sequelize = new Sequelize(
    process.env.DB_NAME || 'task_management',
    'postgres', // Dùng postgres user để có quyền đổi owner
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

    console.log('🔧 Đang đổi owner các bảng sang user root...\n');

    const tables = ['users', 'tasks', 'checklists', 'task_assignments', 'attachments'];
    const sequences = ['users_id_seq', 'tasks_id_seq', 'checklists_id_seq', 'task_assignments_id_seq', 'attachments_id_seq'];

    // Đổi owner của schema public
    try {
      await sequelize.query('ALTER SCHEMA public OWNER TO root');
      console.log('✅ Đã đổi owner của schema public sang root');
    } catch (error) {
      console.log(`⚠️  Schema public: ${error.message}`);
    }

    // Đổi owner của các bảng
    for (const table of tables) {
      try {
        await sequelize.query(`ALTER TABLE ${table} OWNER TO root`);
        console.log(`✅ Đã đổi owner của bảng ${table} sang root`);
      } catch (error) {
        console.log(`⚠️  Bảng ${table}: ${error.message}`);
      }
    }

    // Đổi owner của các sequences
    for (const seq of sequences) {
      try {
        await sequelize.query(`ALTER SEQUENCE ${seq} OWNER TO root`);
        console.log(`✅ Đã đổi owner của sequence ${seq} sang root`);
      } catch (error) {
        // Sequence có thể không tồn tại hoặc đã được đổi, không sao
        if (!error.message.includes('does not exist')) {
          console.log(`⚠️  Sequence ${seq}: ${error.message}`);
        }
      }
    }

    await sequelize.close();
    console.log('\n🎉 Đổi owner thành công!');
    console.log('💡 Bây giờ bạn có thể restart backend server\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    if (error.name === 'SequelizeConnectionError') {
      console.error('\n💡 Gợi ý:');
      console.error('   1. Đảm bảo PostgreSQL đang chạy');
      console.error('   2. User postgres có password không?');
      console.error('   3. Hoặc chạy script SQL trong pgAdmin Query Tool\n');
    }
    process.exit(1);
  }
}

changeOwnership();

