const { sequelize, Checklist } = require('../models');
require('dotenv').config();

async function runMigration() {
  try {
    console.log('🔄 Đang kết nối database...');
    await sequelize.authenticate();
    console.log('✅ Đã kết nối database thành công');
    
    console.log('🔄 Đang sync database để thêm field assigned_to...');
    // Sử dụng alter: true để Sequelize tự động thêm field mới
    await sequelize.sync({ alter: true });
    console.log('✅ Đã sync database thành công');
    
    // Kiểm tra field đã được thêm chưa
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'checklists' AND column_name = 'assigned_to'
    `);
    
    if (results.length > 0) {
      console.log('\n✅ Migration thành công!');
      console.log('✅ Field assigned_to đã tồn tại trong bảng checklists');
      console.log('   - Data type:', results[0].data_type);
      console.log('   - Nullable:', results[0].is_nullable);
    } else {
      console.log('\n⚠️  Field assigned_to chưa được tìm thấy');
      console.log('   Có thể cần restart server để sync');
    }
    
    await sequelize.close();
    console.log('\n✅ Hoàn tất!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Lỗi:', error.message);
    console.error(error);
    
    // Nếu lỗi là về kết nối, đưa ra hướng dẫn
    if (error.message.includes('ECONNREFUSED') || error.message.includes('timeout')) {
      console.log('\n💡 Hướng dẫn:');
      console.log('   1. Đảm bảo PostgreSQL đang chạy');
      console.log('   2. Kiểm tra file .env có đúng thông tin database không');
      console.log('   3. Hoặc chạy migration thủ công bằng psql');
    }
    
    try {
      await sequelize.close();
    } catch (e) {
      // Ignore
    }
    process.exit(1);
  }
}

runMigration();

