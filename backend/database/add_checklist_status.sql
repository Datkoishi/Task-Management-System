-- Migration: Thêm field status vào bảng checklists
-- Chạy script này để thêm trạng thái (todo, in_progress, completed) cho checklist items

-- Thêm cột status với giá trị mặc định là 'todo'
ALTER TABLE checklists 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed'));

-- Cập nhật status dựa trên is_completed hiện tại (backward compatible)
UPDATE checklists 
SET status = CASE 
  WHEN is_completed = true THEN 'completed'
  ELSE 'todo'
END
WHERE status = 'todo';

-- Tạo index để tăng hiệu suất truy vấn
CREATE INDEX IF NOT EXISTS idx_checklists_status ON checklists(status);

-- Xong!
SELECT 'Migration completed successfully! Field status added to checklists table.' as status;

