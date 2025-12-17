const bcrypt = require('bcryptjs');
const { sequelize } = require('../models');
require('dotenv').config();

async function createAdmin() {
  try {
    // Đồng bộ database trước
    await sequelize.authenticate();
    console.log('✅ Kết nối database thành công');
    
    await sequelize.sync({ alter: true });
    console.log('✅ Đồng bộ database thành công');

    // Import User model sau khi sync
    const { User } = require('../models');

    // Tạo admin user
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';
    
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    
    if (existingAdmin) {
      console.log('⚠️  Admin đã tồn tại. Đang cập nhật mật khẩu...');
      existingAdmin.password = await bcrypt.hash(adminPassword, 10);
      existingAdmin.role = 'admin';
      existingAdmin.name = 'Quản trị viên';
      await existingAdmin.save();
      console.log('✅ Cập nhật admin thành công!');
    } else {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await User.create({
        name: 'Quản trị viên',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
      });
      console.log('✅ Tạo admin thành công!');
    }
    
    console.log('\n📧 Thông tin đăng nhập:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('\n⚠️  Lưu ý: Hãy đổi mật khẩu sau lần đăng nhập đầu tiên!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    if (error.name === 'SequelizeConnectionError') {
      console.error('\n💡 Gợi ý:');
      console.error('   1. Đảm bảo PostgreSQL đang chạy');
      console.error('   2. Kiểm tra thông tin trong file .env');
      console.error('   3. Tạo database trước: CREATE DATABASE task_management;');
    }
    process.exit(1);
  }
}

createAdmin();

