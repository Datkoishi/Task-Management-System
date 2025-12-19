const sequelize = require('../config/database');

async function runMigration() {
  try {
    console.log('Đang chạy migration: Thêm tính năng Checklist Groups...');
    
    // Kiểm tra xem bảng checklist_groups đã tồn tại chưa
    const [tableResults] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'checklist_groups';
    `);

    if (tableResults.length === 0) {
      // Tạo bảng checklist_groups
      await sequelize.query(`
        CREATE TABLE checklist_groups (
          id SERIAL PRIMARY KEY,
          task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✓ Đã tạo bảng checklist_groups');
    } else {
      console.log('✓ Bảng checklist_groups đã tồn tại');
    }

    // Kiểm tra và thêm cột group_id vào checklists
    const [columnResults] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'checklists' AND column_name = 'group_id';
    `);

    if (columnResults.length === 0) {
      await sequelize.query(`
        ALTER TABLE checklists 
        ADD COLUMN group_id INTEGER REFERENCES checklist_groups(id) ON DELETE CASCADE;
      `);
      console.log('✓ Đã thêm cột group_id vào bảng checklists');
    } else {
      console.log('✓ Cột group_id đã tồn tại trong bảng checklists');
    }

    // Kiểm tra và tạo indexes
    const [index1Results] = await sequelize.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'checklist_groups' AND indexname = 'idx_checklist_groups_task_id';
    `);

    if (index1Results.length === 0) {
      await sequelize.query(`
        CREATE INDEX idx_checklist_groups_task_id ON checklist_groups(task_id);
      `);
      console.log('✓ Đã tạo index idx_checklist_groups_task_id');
    }

    const [index2Results] = await sequelize.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'checklists' AND indexname = 'idx_checklists_group_id';
    `);

    if (index2Results.length === 0) {
      await sequelize.query(`
        CREATE INDEX idx_checklists_group_id ON checklists(group_id);
      `);
      console.log('✓ Đã tạo index idx_checklists_group_id');
    }

    console.log('\n✅ Migration hoàn tất thành công!');
    console.log('Tính năng Checklist Groups đã được thêm vào hệ thống.');
    
  } catch (error) {
    console.error('❌ Lỗi khi chạy migration:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Chạy migration
runMigration();

