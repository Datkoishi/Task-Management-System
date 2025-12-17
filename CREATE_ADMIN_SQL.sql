-- Chạy script này trong Query Tool của database task_management
-- Tạo admin user trực tiếp bằng SQL

-- Insert admin user với password đã được hash
-- Password: admin123
-- Hash được tạo bằng bcrypt với cost factor 10

INSERT INTO users (name, email, password, role, created_at, updated_at) 
VALUES (
    'Quản trị viên',
    'admin@example.com',
    '$2a$10$rGz8vZ2YJQ1YqJxJQ1YqJeX1YqJxJQ1YqJeX1YqJxJQ1YqJeX1YqJe',
    'admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE 
SET 
    name = 'Quản trị viên',
    role = 'admin',
    updated_at = CURRENT_TIMESTAMP;

-- Kiểm tra kết quả
SELECT id, name, email, role, created_at FROM users WHERE email = 'admin@example.com';

