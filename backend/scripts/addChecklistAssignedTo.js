const sequelize = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Đang chạy migration: Thêm field assigned_to vào bảng checklists...');
    
    // Kiểm tra xem field đã tồn tại chưa
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'checklists' AND column_name = 'assigned_to';
    `);

    if (results.length > 0) {
      console.log('✓ Field assigned_to đã tồn tại trong bảng checklists');
    } else {
      // Thêm cột assigned_to
      await sequelize.query(`
        ALTER TABLE checklists 
        ADD COLUMN assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL;
      `);
      console.log('✓ Đã thêm cột assigned_to vào bảng checklists');
    }

    // Kiểm tra và tạo index
    const [indexResults] = await sequelize.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'checklists' AND indexname = 'idx_checklists_assigned_to';
    `);

    if (indexResults.length > 0) {
      console.log('✓ Index idx_checklists_assigned_to đã tồn tại');
    } else {
      await sequelize.query(`
        CREATE INDEX idx_checklists_assigned_to ON checklists(assigned_to);
      `);
      console.log('✓ Đã tạo index idx_checklists_assigned_to');
    }

    console.log('\n✅ Migration hoàn tất thành công!');
    console.log('Field assigned_to đã được thêm vào bảng checklists.');
    
  } catch (error) {
    console.error('❌ Lỗi khi chạy migration:', error.message);
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Field hoặc index đã tồn tại, không cần tạo lại.');
    } else {
      throw error;
    }
  } finally {
    await sequelize.close();
  }
}

// Chạy migration
runMigration();





