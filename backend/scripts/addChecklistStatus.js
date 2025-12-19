const sequelize = require('../config/database');

async function runMigration() {
  try {
    console.log('Đang chạy migration: Thêm field status vào bảng checklists...');
    
    // Kiểm tra xem field đã tồn tại chưa
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'checklists' AND column_name = 'status';
    `);

    if (results.length > 0) {
      console.log('✓ Field status đã tồn tại trong bảng checklists');
    } else {
      // Thêm cột status
      await sequelize.query(`
        ALTER TABLE checklists 
        ADD COLUMN status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed'));
      `);
      console.log('✓ Đã thêm cột status vào bảng checklists');
      
      // Cập nhật status dựa trên is_completed hiện tại
      await sequelize.query(`
        UPDATE checklists 
        SET status = CASE 
          WHEN is_completed = true THEN 'completed'
          ELSE 'todo'
        END;
      `);
      console.log('✓ Đã cập nhật status cho các checklist items hiện có');
    }

    // Kiểm tra và tạo index
    const [indexResults] = await sequelize.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'checklists' AND indexname = 'idx_checklists_status';
    `);

    if (indexResults.length > 0) {
      console.log('✓ Index idx_checklists_status đã tồn tại');
    } else {
      await sequelize.query(`
        CREATE INDEX idx_checklists_status ON checklists(status);
      `);
      console.log('✓ Đã tạo index idx_checklists_status');
    }

    console.log('\n✅ Migration hoàn tất thành công!');
    console.log('Field status đã được thêm vào bảng checklists.');
    
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

