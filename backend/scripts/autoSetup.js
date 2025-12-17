const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function tryConnection(user, password) {
  const sequelize = new Sequelize('postgres', user, password, {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
  });

  try {
    await sequelize.authenticate();
    await sequelize.close();
    return true;
  } catch (error) {
    return false;
  }
}

async function createDatabase(user, password, dbName) {
  const sequelize = new Sequelize('postgres', user, password, {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
  });

  try {
    await sequelize.authenticate();
    console.log(`✅ Kết nối PostgreSQL thành công với user: ${user}`);

    const [results] = await sequelize.query(
      `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`
    );

    if (results.length === 0) {
      await sequelize.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Đã tạo database: ${dbName}`);
    } else {
      console.log(`ℹ️  Database ${dbName} đã tồn tại`);
    }

    await sequelize.close();
    return true;
  } catch (error) {
    await sequelize.close();
    throw error;
  }
}

async function autoSetup() {
  console.log('🔍 Đang kiểm tra kết nối PostgreSQL...\n');

  const dbName = process.env.DB_NAME || 'task_management';
  const users = [
    { user: 'root', password: '18042005' },
    { user: 'postgres', password: '' },
    { user: process.env.USER || 'truongdat', password: '' },
  ];

  let connected = false;
  let workingUser = null;

  for (const { user, password } of users) {
    console.log(`⏳ Thử kết nối với user: ${user}...`);
    if (await tryConnection(user, password)) {
      workingUser = { user, password };
      connected = true;
      console.log(`✅ Kết nối thành công với user: ${user}\n`);
      break;
    } else {
      console.log(`❌ Không thể kết nối với user: ${user}\n`);
    }
  }

  if (!connected) {
    console.log('❌ Không thể kết nối với PostgreSQL!');
    console.log('\n💡 Có thể do:');
    console.log('   1. PostgreSQL chưa được cài đặt hoặc chưa chạy');
    console.log('   2. Cần tạo user root thủ công');
    console.log('\n🔧 Hướng dẫn:');
    console.log('   1. Mở Terminal và chạy: psql -U postgres');
    console.log('   2. Tạo user: CREATE USER root WITH PASSWORD \'18042005\';');
    console.log('   3. Cấp quyền: ALTER USER root CREATEDB;');
    console.log('   4. Thoát: \\q');
    console.log('   5. Chạy lại: npm run init-db\n');
    process.exit(1);
  }

  try {
    await createDatabase(workingUser.user, workingUser.password, dbName);
    
    // Cập nhật file .env nếu dùng user khác
    if (workingUser.user !== process.env.DB_USER) {
      const envPath = path.join(__dirname, '..', '.env');
      let envContent = fs.readFileSync(envPath, 'utf8');
      envContent = envContent.replace(
        /^DB_USER=.*$/m,
        `DB_USER=${workingUser.user}`
      );
      if (workingUser.password) {
        envContent = envContent.replace(
          /^DB_PASSWORD=.*$/m,
          `DB_PASSWORD=${workingUser.password}`
        );
      }
      fs.writeFileSync(envPath, envContent);
      console.log(`\n📝 Đã cập nhật file .env với user: ${workingUser.user}`);
    }

    console.log('\n🎉 Khởi tạo database thành công!');
    console.log('💡 Tiếp theo, chạy: npm run create-admin\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi tạo database:', error.message);
    process.exit(1);
  }
}

autoSetup();

