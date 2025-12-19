-- Migration: Thêm tính năng Checklist Groups (checklist mẹ)
-- Chạy script này để thêm cấu trúc phân cấp cho checklists

-- Tạo bảng checklist_groups
CREATE TABLE IF NOT EXISTS checklist_groups (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Thêm cột group_id vào bảng checklists
ALTER TABLE checklists 
ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES checklist_groups(id) ON DELETE CASCADE;

-- Tạo indexes để tăng hiệu suất
CREATE INDEX IF NOT EXISTS idx_checklist_groups_task_id ON checklist_groups(task_id);
CREATE INDEX IF NOT EXISTS idx_checklists_group_id ON checklists(group_id);

-- Xong!
SELECT 'Migration completed successfully! Checklist groups feature added.' as status;

