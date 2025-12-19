-- Migration: Thêm field assigned_to vào bảng checklist_groups
-- Chạy script này để thêm tính năng gán người cho checklist groups

-- Thêm cột assigned_to (có thể NULL)
ALTER TABLE checklist_groups 
ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Tạo index để tăng hiệu suất truy vấn
CREATE INDEX IF NOT EXISTS idx_checklist_groups_assigned_to ON checklist_groups(assigned_to);

-- Xong!
SELECT 'Migration completed successfully! Field assigned_to added to checklist_groups table.' as status;

