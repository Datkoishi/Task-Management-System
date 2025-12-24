const sequelize = require('../config/database');

async function runMigration() {
  try {
    console.log('Đang chạy migration: Thêm tính năng Sub-tasks cho Checklist Items...');
    
    // Kiểm tra xem bảng sub_tasks đã tồn tại chưa
    const [tableResults] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'sub_tasks';
    `);

    if (tableResults.length === 0) {
      // Tạo bảng sub_tasks
      await sequelize.query(`
        CREATE TABLE sub_tasks (
          id SERIAL PRIMARY KEY,
          checklist_id INTEGER NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          is_completed BOOLEAN DEFAULT FALSE,
          status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed')),
          created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✓ Đã tạo bảng sub_tasks');
    } else {
      console.log('✓ Bảng sub_tasks đã tồn tại');
    }

    // Kiểm tra và tạo indexes
    const [index1Results] = await sequelize.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'sub_tasks' AND indexname = 'idx_sub_tasks_checklist_id';
    `);

    if (index1Results.length === 0) {
      await sequelize.query(`
        CREATE INDEX idx_sub_tasks_checklist_id ON sub_tasks(checklist_id);
      `);
      console.log('✓ Đã tạo index idx_sub_tasks_checklist_id');
    } else {
      console.log('✓ Index idx_sub_tasks_checklist_id đã tồn tại');
    }

    const [index2Results] = await sequelize.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'sub_tasks' AND indexname = 'idx_sub_tasks_created_by';
    `);

    if (index2Results.length === 0) {
      await sequelize.query(`
        CREATE INDEX idx_sub_tasks_created_by ON sub_tasks(created_by);
      `);
      console.log('✓ Đã tạo index idx_sub_tasks_created_by');
    } else {
      console.log('✓ Index idx_sub_tasks_created_by đã tồn tại');
    }

    // Tạo trigger để tự động cập nhật updated_at
    await sequelize.query(`
      DROP TRIGGER IF EXISTS update_sub_tasks_updated_at ON sub_tasks;
    `);

    await sequelize.query(`
      CREATE TRIGGER update_sub_tasks_updated_at 
      BEFORE UPDATE ON sub_tasks
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✓ Đã tạo trigger update_sub_tasks_updated_at');

    console.log('Tính năng Sub-tasks đã được thêm vào hệ thống.');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi chạy migration:', error);
    process.exit(1);
  }
}

runMigration();

